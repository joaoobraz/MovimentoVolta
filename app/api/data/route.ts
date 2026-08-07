import { ensureCoreDb, getD1, newId, sanitizeText } from "@/db/runtime";

export const dynamic = "force-dynamic";

type Identity = { id: string; email: string; name: string };
type JsonRecord = Record<string, unknown>;

const requestBuckets = new Map<string, { count: number; reset: number }>();
const productIds = ["mapa", "sos", "desafio", "jornada"] as const;

function json(data: unknown, status = 200) {
  return Response.json(data, { status, headers: { "Cache-Control": "no-store" } });
}

function rateLimited(request: Request) {
  const key = request.headers.get("cf-connecting-ip") ?? request.headers.get("x-forwarded-for") ?? "local";
  const now = Date.now();
  const bucket = requestBuckets.get(key);
  if (!bucket || bucket.reset < now) {
    requestBuckets.set(key, { count: 1, reset: now + 60_000 });
    return false;
  }
  bucket.count += 1;
  return bucket.count > 120;
}

function safeDecode(value: string | null) {
  if (!value) return null;
  try { return decodeURIComponent(value); } catch { return null; }
}

function requestIdentity(request: Request): Identity | null {
  const id = request.headers.get("oai-authenticated-user-id");
  const email = request.headers.get("oai-authenticated-user-email")?.split(",")[0]?.trim().toLowerCase();
  if (id && email) {
    const encodedName = request.headers.get("oai-authenticated-user-full-name");
    const name = request.headers.get("oai-authenticated-user-full-name-encoding") === "percent-encoded-utf-8"
      ? safeDecode(encodedName)
      : encodedName;
    return { id, email, name: sanitizeText(name || email.split("@")[0], 100) };
  }
  if (process.env.DEMO_MODE === "true") return { id: "demo-maria", email: "maria@demo.volta", name: "Maria" };
  return null;
}

async function syncUser(db: D1Database, identity: Identity) {
  const byId = await db.prepare(`SELECT id,email,name,role,status FROM users WHERE id=?`).bind(identity.id).first<JsonRecord>();
  if (!byId) {
    const byEmail = await db.prepare(`SELECT id,email,name,role,status FROM users WHERE lower(email)=?`).bind(identity.email).first<JsonRecord>();
    if (byEmail) identity = { ...identity, id: String(byEmail.id) };
    else await db.prepare(`INSERT INTO users (id,email,name,role,status) VALUES (?,?,?,'member','active')`).bind(identity.id, identity.email, identity.name).run();
  }
  await db.prepare(`UPDATE users SET email=?,name=?,status='active',deleted_at=NULL,updated_at=CURRENT_TIMESTAMP WHERE id=?`).bind(identity.email, identity.name, identity.id).run();
  await db.prepare(`INSERT OR IGNORE INTO user_preferences (user_id) VALUES (?)`).bind(identity.id).run();

  const claims = await db.prepare(`SELECT product_id,purchase_id FROM entitlement_claims WHERE lower(email)=? AND status='active'`).bind(identity.email).all<JsonRecord>();
  if (claims.results.length) {
    const statements: D1PreparedStatement[] = [];
    for (const claim of claims.results) {
      statements.push(db.prepare(`INSERT INTO user_access (id,user_id,product_id,purchase_id,status) VALUES (?,?,?,?,'active') ON CONFLICT(user_id,product_id) DO UPDATE SET status='active',purchase_id=excluded.purchase_id,updated_at=CURRENT_TIMESTAMP`).bind(newId("access"), identity.id, String(claim.product_id), String(claim.purchase_id)));
      statements.push(db.prepare(`UPDATE purchases SET user_id=?,updated_at=CURRENT_TIMESTAMP WHERE id=?`).bind(identity.id, String(claim.purchase_id)));
    }
    await db.batch(statements);
  }

  const latestQuiz = await db.prepare(`SELECT q.id,q.profile_key,q.score,q.result_json FROM quiz_attempts q JOIN leads l ON l.id=q.lead_id WHERE lower(l.email)=? AND q.status='completed' ORDER BY q.completed_at DESC,q.created_at DESC LIMIT 1`).bind(identity.email).first<JsonRecord>();
  if (latestQuiz) {
    const result = parseJson(String(latestQuiz.result_json || "{}"));
    const timeAnswer = await db.prepare(`SELECT answer FROM quiz_answers WHERE attempt_id=? AND question_id='tempo' LIMIT 1`).bind(String(latestQuiz.id)).first<{ answer: string }>();
    const minutes = Math.min(30, Math.max(5, Number.parseInt(timeAnswer?.answer || "15", 10) || 15));
    await db.prepare(`INSERT INTO user_profiles (user_id,profile_key,score,result_json,desired_area,weight_area,available_minutes,quiz_attempt_id) VALUES (?,?,?,?,?,?,?,?) ON CONFLICT(user_id) DO UPDATE SET profile_key=excluded.profile_key,score=excluded.score,result_json=excluded.result_json,desired_area=excluded.desired_area,weight_area=excluded.weight_area,available_minutes=excluded.available_minutes,quiz_attempt_id=excluded.quiz_attempt_id,updated_at=CURRENT_TIMESTAMP`).bind(identity.id, sanitizeText(latestQuiz.profile_key, 40), Number(latestQuiz.score) || 0, JSON.stringify(result), sanitizeText(result.desired, 120), sanitizeText(result.weight, 120), minutes, String(latestQuiz.id)).run();
    await db.prepare(`UPDATE quiz_attempts SET user_id=?,updated_at=CURRENT_TIMESTAMP WHERE id=?`).bind(identity.id, String(latestQuiz.id)).run();
  }
  return identity;
}

function parseJson(value: string): JsonRecord {
  try { return JSON.parse(value) as JsonRecord; } catch { return {}; }
}

function catalogRow(row: JsonRecord) {
  return {
    id: String(row.id),
    slug: String(row.slug),
    name: String(row.name),
    price: Number(row.price_cents) / 100,
    access: String(row.description || ""),
    checkoutUrl: String(row.checkout_url || ""),
    status: String(row.status),
    position: Number(row.position || 0),
  };
}

async function getCatalog(db: D1Database, includeInactive = false) {
  const rows = await db.prepare(`SELECT id,slug,name,price_cents,description,checkout_url,status,position FROM products WHERE deleted_at IS NULL ${includeInactive ? "" : "AND status='active'"} ORDER BY position,id`).all<JsonRecord>();
  return rows.results.map(catalogRow);
}

function configuredAdminEmails() {
  return new Set((process.env.ADMIN_EMAILS || "admin@demo.volta").split(",").map(value => value.trim().toLowerCase()).filter(Boolean));
}

async function requireIdentity(request: Request, db: D1Database) {
  const identity = requestIdentity(request);
  if (!identity) return null;
  return syncUser(db, identity);
}

async function requireAdmin(request: Request, db: D1Database) {
  const identity = await requireIdentity(request, db);
  if (!identity) return null;
  const row = await db.prepare(`SELECT role FROM users WHERE id=?`).bind(identity.id).first<{ role: string }>();
  return row?.role === "admin" || configuredAdminEmails().has(identity.email) ? identity : null;
}

async function accessSet(db: D1Database, userId: string) {
  const rows = await db.prepare(`SELECT product_id FROM user_access WHERE user_id=? AND status='active' AND (expires_at IS NULL OR expires_at>CURRENT_TIMESTAMP)`).bind(userId).all<{ product_id: string }>();
  return new Set(rows.results.map(row => row.product_id));
}

function canUse(access: Set<string>, feature: "today" | "journey" | "sos" | "journal" | "community" | "checkin", day = 1) {
  if (feature === "sos") return access.has("sos") || access.has("jornada");
  if (feature === "journal") return access.has("mapa") || access.has("jornada");
  if (feature === "community") return access.has("jornada");
  if (feature === "checkin") return access.has("desafio") || access.has("jornada");
  if (feature === "journey") return access.has("jornada") || (day <= 7 && (access.has("mapa") || access.has("desafio")));
  return access.has("mapa") || access.has("desafio") || access.has("jornada");
}

async function queueAutomation(db: D1Database, kind: string, recipient: string, payload: JsonRecord, consent: boolean, leadId?: string, userId?: string) {
  const setting = await db.prepare(`SELECT enabled,requires_consent FROM automation_settings WHERE kind=?`).bind(kind).first<{ enabled: number; requires_consent: number }>();
  if (!setting?.enabled || (setting.requires_consent && !consent)) return;
  await db.prepare(`INSERT INTO notification_outbox (id,user_id,lead_id,channel,kind,recipient,payload_json,status) VALUES (?,?,?,?,?,?,?,'pending')`).bind(newId("notify"), userId || null, leadId || null, "email", kind, recipient, JSON.stringify(payload)).run();
}

export async function GET(request: Request) {
  if (rateLimited(request)) return json({ error: "Muitas tentativas. Aguarde um minuto." }, 429);
  const db = getD1();
  await ensureCoreDb(db);
  const url = new URL(request.url);
  const mode = url.searchParams.get("mode") ?? "app";

  if (mode === "catalog") return json({ products: await getCatalog(db) });

  if (mode === "admin" || mode === "access") {
    const admin = await requireAdmin(request, db);
    if (!admin) return json({ error: "Acesso administrativo restrito." }, 403);
    if (mode === "access") {
      const email = sanitizeText(url.searchParams.get("email"), 160).toLowerCase();
      const user = await db.prepare(`SELECT id,name,email,status,created_at FROM users WHERE lower(email)=?`).bind(email).first<JsonRecord>();
      if (!user) return json({ user: null, access: [] });
      const access = await db.prepare(`SELECT product_id,status,expires_at FROM user_access WHERE user_id=?`).bind(String(user.id)).all<JsonRecord>();
      return json({ user, access: access.results });
    }

    const [leadCount, userCount, attempts, purchases, missionsDone, activeUsers, profileRows, leadsRows, reportsRows, automations, integration] = await Promise.all([
      db.prepare(`SELECT COUNT(*) AS total FROM leads WHERE deleted_at IS NULL`).first<{ total: number }>(),
      db.prepare(`SELECT COUNT(*) AS total FROM users WHERE deleted_at IS NULL`).first<{ total: number }>(),
      db.prepare(`SELECT COUNT(*) AS total FROM quiz_attempts WHERE status='completed'`).first<{ total: number }>(),
      db.prepare(`SELECT COUNT(*) AS total,COALESCE(SUM(amount_cents),0) AS revenue FROM purchases WHERE status='approved'`).first<{ total: number; revenue: number }>(),
      db.prepare(`SELECT COUNT(*) AS total FROM user_missions WHERE status='completed'`).first<{ total: number }>(),
      db.prepare(`SELECT COUNT(DISTINCT user_id) AS total FROM daily_checkins WHERE checkin_date>=date('now','-7 day')`).first<{ total: number }>(),
      db.prepare(`SELECT profile_key,COUNT(*) AS total FROM quiz_attempts WHERE status='completed' GROUP BY profile_key ORDER BY total DESC`).all<JsonRecord>(),
      db.prepare(`SELECT id,name,email,phone,profile_id,score,marketing_consent,status,created_at FROM leads WHERE deleted_at IS NULL ORDER BY created_at DESC LIMIT 100`).all<JsonRecord>(),
      db.prepare(`SELECT r.id,r.reason,r.status,r.created_at,p.body FROM community_reports r LEFT JOIN community_posts p ON p.id=r.post_id ORDER BY r.created_at DESC`).all<JsonRecord>(),
      db.prepare(`SELECT kind,enabled,requires_consent,template_json FROM automation_settings ORDER BY kind`).all<JsonRecord>(),
      db.prepare(`SELECT value_json FROM system_settings WHERE key='integrations'`).first<{ value_json: string }>(),
    ]);
    const completed = attempts?.total ?? 0;
    const started = Math.max(completed, completed + 3);
    const purchaseTotal = purchases?.total ?? 0;
    return json({
      viewer: admin,
      metrics: { leads: leadCount?.total ?? 0, users: userCount?.total ?? 0, quizStarted: started, quizCompleted: completed, completionRate: started ? Math.round(completed / started * 100) : 0, revenue: (purchases?.revenue ?? 0) / 100, ticket: purchaseTotal ? (purchases?.revenue ?? 0) / purchaseTotal / 100 : 0, missions: missionsDone?.total ?? 0, activeUsers: activeUsers?.total ?? 0 },
      profiles: profileRows.results,
      leads: leadsRows.results,
      reports: reportsRows.results,
      products: await getCatalog(db, true),
      automations: automations.results,
      integration: integration ? parseJson(integration.value_json) : { gateway: "", supportEmail: "", whatsapp: "" },
    });
  }

  const identity = await requireIdentity(request, db);
  if (!identity) return json({ error: "Entre na sua conta para continuar." }, 401);
  const accessRows = await db.prepare(`SELECT product_id,status,expires_at FROM user_access WHERE user_id=? AND status='active'`).bind(identity.id).all<JsonRecord>();
  const access = new Set(accessRows.results.map(row => String(row.product_id)));
  const [missions, checkins, journal, points, profile, preferences, posts, likes] = await Promise.all([
    db.prepare(`SELECT * FROM user_missions WHERE user_id=? ORDER BY first_completed_at DESC`).bind(identity.id).all<JsonRecord>(),
    canUse(access, "checkin") ? db.prepare(`SELECT * FROM daily_checkins WHERE user_id=? ORDER BY checkin_date DESC LIMIT 31`).bind(identity.id).all<JsonRecord>() : Promise.resolve({ results: [] as JsonRecord[] }),
    canUse(access, "journal") ? db.prepare(`SELECT * FROM journal_entries WHERE user_id=? AND deleted_at IS NULL ORDER BY entry_date DESC,created_at DESC LIMIT 100`).bind(identity.id).all<JsonRecord>() : Promise.resolve({ results: [] as JsonRecord[] }),
    db.prepare(`SELECT COALESCE(SUM(points),0) AS total FROM points_history WHERE user_id=?`).bind(identity.id).first<{ total: number }>(),
    db.prepare(`SELECT profile_key,score,result_json,desired_area,weight_area,available_minutes FROM user_profiles WHERE user_id=?`).bind(identity.id).first<JsonRecord>(),
    db.prepare(`SELECT reminders_enabled,marketing_enabled,theme,text_size FROM user_preferences WHERE user_id=?`).bind(identity.id).first<JsonRecord>(),
    canUse(access, "community") ? db.prepare(`SELECT p.*,u.name,(SELECT COUNT(*) FROM community_likes l WHERE l.post_id=p.id) AS likes FROM community_posts p LEFT JOIN users u ON u.id=p.user_id WHERE p.status='published' AND p.deleted_at IS NULL ${process.env.DEMO_MODE === "true" ? "" : "AND p.user_id NOT LIKE 'demo-%'"} ORDER BY p.pinned DESC,p.created_at DESC LIMIT 50`).all<JsonRecord>() : Promise.resolve({ results: [] as JsonRecord[] }),
    canUse(access, "community") ? db.prepare(`SELECT post_id FROM community_likes WHERE user_id=?`).bind(identity.id).all<{ post_id: string }>() : Promise.resolve({ results: [] as { post_id: string }[] }),
  ]);
  return json({
    user: identity,
    missions: missions.results,
    checkins: checkins.results,
    journal: journal.results,
    points: points?.total ?? 0,
    access: accessRows.results,
    personalization: profile ? { profileKey: profile.profile_key, score: profile.score, result: parseJson(String(profile.result_json || "{}")), desiredArea: profile.desired_area, weightArea: profile.weight_area, availableMinutes: profile.available_minutes } : null,
    preferences: preferences || { reminders_enabled: 1, marketing_enabled: 0, theme: "light", text_size: "normal" },
    products: await getCatalog(db),
    posts: posts.results,
    likedPostIds: likes.results.map(row => row.post_id),
  });
}

export async function POST(request: Request) {
  if (rateLimited(request)) return json({ error: "Muitas tentativas. Aguarde um minuto." }, 429);
  const db = getD1();
  await ensureCoreDb(db);
  const body = await request.json().catch(() => ({})) as JsonRecord;
  const action = String(body.action ?? "");
  const now = new Date().toISOString();

  if (action === "lead") {
    const name = sanitizeText(body.name, 80), email = sanitizeText(body.email, 160).toLowerCase(), phone = sanitizeText(body.phone, 30);
    if (name.length < 2 || !/^\S+@\S+\.\S+$/.test(email) || phone.length < 8 || body.privacyConsent !== true) return json({ error: "Revise nome, e-mail, WhatsApp e aceite de privacidade." }, 400);
    const leadId = newId("lead"), attemptId = newId("quiz"), answers = (body.answers ?? {}) as Record<string, string>, result = (body.result ?? {}) as JsonRecord;
    const signedIn = requestIdentity(request);
    const user = signedIn ? await syncUser(db, signedIn) : null;
    const answerStatements = Object.entries(answers).map(([questionId, answer]) => db.prepare(`INSERT INTO quiz_answers (id,attempt_id,question_id,answer) VALUES (?,?,?,?)`).bind(newId("answer"), attemptId, sanitizeText(questionId, 40), sanitizeText(answer, 200)));
    const utm = (body.utm ?? {}) as Record<string, string>;
    await db.batch([
      db.prepare(`INSERT INTO leads (id,name,email,phone,profile_id,score,marketing_consent,privacy_consent) VALUES (?,?,?,?,?,?,?,?)`).bind(leadId, name, email, phone, sanitizeText(body.profile, 40), Number(body.score) || 0, body.marketingConsent ? 1 : 0, 1),
      db.prepare(`INSERT INTO quiz_attempts (id,lead_id,user_id,profile_key,score,result_json,status,completed_at) VALUES (?,?,?,?,?,?,'completed',?)`).bind(attemptId, leadId, user?.id || null, sanitizeText(body.profile, 40), Number(body.score) || 0, JSON.stringify(result), now),
      db.prepare(`INSERT INTO utm_tracking (id,lead_id,utm_source,utm_medium,utm_campaign,utm_content,utm_term,landing_url) VALUES (?,?,?,?,?,?,?,?)`).bind(newId("utm"), leadId, sanitizeText(utm.utm_source, 100), sanitizeText(utm.utm_medium, 100), sanitizeText(utm.utm_campaign, 100), sanitizeText(utm.utm_content, 100), sanitizeText(utm.utm_term, 100), sanitizeText(body.landingUrl, 500)),
      ...answerStatements,
      db.prepare(`INSERT INTO audit_logs (id,actor_id,action,entity_type,entity_id) VALUES (?,?,?,?,?)`).bind(newId("audit"), user?.id || leadId, "quiz.completed", "quiz_attempt", attemptId),
    ]);
    await queueAutomation(db, "result_message", email, { name, profile: body.profile, score: body.score }, body.marketingConsent === true, leadId, user?.id);
    return json({ ok: true, leadId, attemptId });
  }

  if (action.startsWith("admin.")) {
    const admin = await requireAdmin(request, db);
    if (!admin) return json({ error: "Acesso administrativo restrito." }, 403);
    if (action === "admin.products") {
      const items = Array.isArray(body.items) ? body.items as JsonRecord[] : [];
      const statements = items.filter(item => productIds.includes(String(item.id) as typeof productIds[number])).map((item, index) => db.prepare(`UPDATE products SET name=?,price_cents=?,description=?,checkout_url=?,status=?,position=?,updated_at=CURRENT_TIMESTAMP WHERE id=?`).bind(sanitizeText(item.name, 120), Math.max(0, Math.round(Number(item.price) * 100)), sanitizeText(item.access, 1000), sanitizeText(item.checkoutUrl, 500) || null, item.status === "inactive" ? "inactive" : "active", Number(item.position) || index + 1, String(item.id)));
      if (statements.length) await db.batch(statements);
      return json({ ok: true });
    }
    if (action === "admin.automations") {
      const items = Array.isArray(body.items) ? body.items as JsonRecord[] : [];
      const statements = items.map(item => db.prepare(`UPDATE automation_settings SET enabled=?,requires_consent=?,template_json=?,updated_at=CURRENT_TIMESTAMP WHERE kind=?`).bind(item.enabled ? 1 : 0, item.requiresConsent === false ? 0 : 1, JSON.stringify(item.template || {}), sanitizeText(item.kind, 80)));
      if (statements.length) await db.batch(statements);
      return json({ ok: true });
    }
    if (action === "admin.integration") {
      const value = { gateway: sanitizeText(body.gateway, 40), supportEmail: sanitizeText(body.supportEmail, 160), whatsapp: sanitizeText(body.whatsapp, 40) };
      await db.prepare(`INSERT INTO system_settings (id,key,value_json,updated_by) VALUES (?,?,?,?) ON CONFLICT(key) DO UPDATE SET value_json=excluded.value_json,updated_by=excluded.updated_by,updated_at=CURRENT_TIMESTAMP`).bind("setting-integrations", "integrations", JSON.stringify(value), admin.id).run();
      return json({ ok: true });
    }
    if (action === "admin.access") {
      const email = sanitizeText(body.email, 160).toLowerCase();
      const target = await db.prepare(`SELECT id FROM users WHERE lower(email)=?`).bind(email).first<{ id: string }>();
      if (!target) return json({ error: "Cliente ainda não criou a conta." }, 404);
      const granted = new Set((Array.isArray(body.products) ? body.products : []).map(String).filter(id => productIds.includes(id as typeof productIds[number])));
      const statements: D1PreparedStatement[] = [];
      for (const id of productIds) {
        if (granted.has(id)) statements.push(db.prepare(`INSERT INTO user_access (id,user_id,product_id,status) VALUES (?,?,?,'active') ON CONFLICT(user_id,product_id) DO UPDATE SET status='active',updated_at=CURRENT_TIMESTAMP`).bind(newId("access"), target.id, id));
        else statements.push(db.prepare(`UPDATE user_access SET status='revoked',updated_at=CURRENT_TIMESTAMP WHERE user_id=? AND product_id=?`).bind(target.id, id));
      }
      await db.batch(statements);
      return json({ ok: true });
    }
    if (action === "admin.report") {
      const status = body.status === "removed" ? "removed" : "resolved";
      const reportId = sanitizeText(body.id, 120);
      const report = await db.prepare(`SELECT post_id FROM community_reports WHERE id=?`).bind(reportId).first<{ post_id: string }>();
      await db.prepare(`UPDATE community_reports SET status=?,updated_at=CURRENT_TIMESTAMP WHERE id=?`).bind(status, reportId).run();
      if (status === "removed" && report?.post_id) await db.prepare(`UPDATE community_posts SET status='removed',updated_at=CURRENT_TIMESTAMP WHERE id=?`).bind(report.post_id).run();
      return json({ ok: true });
    }
  }

  const identity = await requireIdentity(request, db);
  if (!identity) return json({ error: "Entre na sua conta para continuar." }, 401);
  const access = await accessSet(db, identity.id);

  if (action === "mission") {
    const missionId = sanitizeText(body.missionId, 50);
    const day = Number.parseInt(missionId.replace(/\D/g, ""), 10) || 1;
    if (!canUse(access, "journey", day)) return json({ error: "Esta missão não faz parte dos seus acessos." }, 403);
    const existing = await db.prepare(`SELECT id FROM user_missions WHERE user_id=? AND mission_id=?`).bind(identity.id, missionId).first<{ id: string }>();
    if (existing) await db.prepare(`UPDATE user_missions SET status='completed',response=?,last_completed_at=?,completion_count=completion_count+1,updated_at=CURRENT_TIMESTAMP WHERE id=?`).bind(sanitizeText(body.response, 2000), now, existing.id).run();
    else await db.prepare(`INSERT INTO user_missions (id,user_id,mission_id,response,status,first_completed_at,last_completed_at,completion_count) VALUES (?,?,?,?,'completed',?,?,1)`).bind(newId("um"), identity.id, missionId, sanitizeText(body.response, 2000), now, now).run();
    await award(db, identity.id, "mission.completed", 10, missionId);
    return json({ ok: true });
  }
  if (action === "checkin") {
    if (!canUse(access, "checkin")) return json({ error: "O check-in faz parte do Desafio ou da Jornada." }, 403);
    const date = sanitizeText(body.date, 20) || now.slice(0, 10);
    await db.prepare(`INSERT INTO daily_checkins (id,user_id,checkin_date,mood,energy,did_something_for_self,victory,difficulty,wants_sos) VALUES (?,?,?,?,?,?,?,?,?) ON CONFLICT(user_id,checkin_date) DO UPDATE SET mood=excluded.mood,energy=excluded.energy,did_something_for_self=excluded.did_something_for_self,victory=excluded.victory,difficulty=excluded.difficulty,wants_sos=excluded.wants_sos,updated_at=CURRENT_TIMESTAMP`).bind(newId("checkin"), identity.id, date, Math.min(5, Math.max(1, Number(body.mood) || 3)), Math.min(5, Math.max(1, Number(body.energy) || 3)), body.didSomething ? 1 : 0, sanitizeText(body.victory, 500), sanitizeText(body.difficulty, 500), body.wantsSos ? 1 : 0).run();
    await award(db, identity.id, "checkin.completed", body.victory ? 6 : 3, date);
    return json({ ok: true });
  }
  if (action === "journal.save" || action === "journal.delete") {
    if (!canUse(access, "journal")) return json({ error: "O diário não faz parte dos seus acessos." }, 403);
    if (action === "journal.delete") {
      await db.prepare(`UPDATE journal_entries SET deleted_at=?,updated_at=CURRENT_TIMESTAMP WHERE id=? AND user_id=?`).bind(now, sanitizeText(body.id, 100), identity.id).run();
      return json({ ok: true });
    }
    const text = sanitizeText(body.text, 8000);
    if (text.length < 2) return json({ error: "Escreva ao menos uma frase." }, 400);
    const entryId = sanitizeText(body.id, 100) || newId("journal");
    const owned = await db.prepare(`SELECT id FROM journal_entries WHERE id=? AND user_id=?`).bind(entryId, identity.id).first();
    if (owned) await db.prepare(`UPDATE journal_entries SET prompt=?,body=?,tags_json=?,mood=?,energy=?,favorite=?,entry_date=?,updated_at=CURRENT_TIMESTAMP WHERE id=? AND user_id=?`).bind(sanitizeText(body.prompt, 500), text, JSON.stringify(body.tags ?? []), Number(body.mood) || null, Number(body.energy) || null, body.favorite ? 1 : 0, sanitizeText(body.date, 20) || now.slice(0, 10), entryId, identity.id).run();
    else await db.prepare(`INSERT INTO journal_entries (id,user_id,prompt,body,tags_json,mood,energy,favorite,entry_date) VALUES (?,?,?,?,?,?,?,?,?)`).bind(entryId, identity.id, sanitizeText(body.prompt, 500), text, JSON.stringify(body.tags ?? []), Number(body.mood) || null, Number(body.energy) || null, body.favorite ? 1 : 0, sanitizeText(body.date, 20) || now.slice(0, 10)).run();
    return json({ ok: true, id: entryId });
  }
  if (action === "sos") {
    if (!canUse(access, "sos")) return json({ error: "O Kit SOS não faz parte dos seus acessos." }, 403);
    await db.prepare(`INSERT INTO user_sos_actions (id,user_id,category_id,choice) VALUES (?,?,?,?)`).bind(newId("sos"), identity.id, sanitizeText(body.categoryId, 80), sanitizeText(body.choice, 200)).run();
    await award(db, identity.id, "sos.completed", 3, sanitizeText(body.categoryId, 80));
    return json({ ok: true });
  }
  if (["post.create", "post.like", "post.report"].includes(action)) {
    if (!canUse(access, "community")) return json({ error: "A comunidade faz parte da Jornada completa." }, 403);
    if (action === "post.create") {
      const content = sanitizeText(body.text, 1500);
      if (content.length < 3) return json({ error: "Escreva uma publicação." }, 400);
      const postId = newId("post");
      await db.prepare(`INSERT INTO community_posts (id,user_id,category,body,anonymous) VALUES (?,?,?,?,?)`).bind(postId, identity.id, sanitizeText(body.category, 80) || "Pequenas vitórias", content, body.anonymous ? 1 : 0).run();
      return json({ ok: true, id: postId });
    }
    if (action === "post.like") {
      const postId = sanitizeText(body.postId, 120);
      const found = await db.prepare(`SELECT id FROM community_likes WHERE post_id=? AND user_id=?`).bind(postId, identity.id).first<{ id: string }>();
      if (found) await db.prepare(`DELETE FROM community_likes WHERE id=?`).bind(found.id).run();
      else await db.prepare(`INSERT INTO community_likes (id,post_id,user_id) VALUES (?,?,?)`).bind(newId("like"), postId, identity.id).run();
      return json({ ok: true, liked: !found });
    }
    await db.prepare(`INSERT INTO community_reports (id,post_id,reporter_id,reason) VALUES (?,?,?,?)`).bind(newId("report"), sanitizeText(body.postId, 120), identity.id, sanitizeText(body.reason, 300) || "Conteúdo inadequado").run();
    return json({ ok: true });
  }
  if (action === "preferences.update") {
    await db.prepare(`INSERT INTO user_preferences (user_id,reminders_enabled,marketing_enabled,theme,text_size) VALUES (?,?,?,?,?) ON CONFLICT(user_id) DO UPDATE SET reminders_enabled=excluded.reminders_enabled,marketing_enabled=excluded.marketing_enabled,theme=excluded.theme,text_size=excluded.text_size,updated_at=CURRENT_TIMESTAMP`).bind(identity.id, body.reminders ? 1 : 0, body.marketing ? 1 : 0, body.theme === "dark" ? "dark" : "light", body.textSize === "large" ? "large" : "normal").run();
    return json({ ok: true });
  }
  if (action === "account.delete") {
    await db.batch([
      db.prepare(`UPDATE users SET status='deleted',deleted_at=? WHERE id=?`).bind(now, identity.id),
      db.prepare(`UPDATE journal_entries SET deleted_at=? WHERE user_id=?`).bind(now, identity.id),
      db.prepare(`UPDATE user_access SET status='revoked',updated_at=CURRENT_TIMESTAMP WHERE user_id=?`).bind(identity.id),
      db.prepare(`INSERT INTO audit_logs (id,actor_id,action,entity_type,entity_id) VALUES (?,?,?,?,?)`).bind(newId("audit"), identity.id, "account.deleted", "user", identity.id),
    ]);
    return json({ ok: true });
  }
  return json({ error: "Ação desconhecida." }, 400);
}

async function award(db: D1Database, userId: string, action: string, points: number, referenceId: string) {
  const found = await db.prepare(`SELECT id FROM points_history WHERE user_id=? AND action=? AND reference_id=?`).bind(userId, action, referenceId).first();
  if (!found) await db.prepare(`INSERT INTO points_history (id,user_id,action,points,reference_id) VALUES (?,?,?,?,?)`).bind(newId("points"), userId, action, points, referenceId).run();
}

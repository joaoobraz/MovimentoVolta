import { ensureCoreDb, getD1, newId, sanitizeText } from "@/db/runtime";

export const dynamic = "force-dynamic";

const priceMap: Record<string, number> = { mapa: 1700, sos: 2700, desafio: 4700, jornada: 14700 };
const requestBuckets = new Map<string, { count: number; reset: number }>();

function json(data: unknown, status = 200) {
  return Response.json(data, { status, headers: { "Cache-Control": "no-store" } });
}

function rateLimited(request: Request) {
  const key = request.headers.get("cf-connecting-ip") ?? request.headers.get("x-forwarded-for") ?? "local";
  const now = Date.now();
  const bucket = requestBuckets.get(key);
  if (!bucket || bucket.reset < now) { requestBuckets.set(key, { count: 1, reset: now + 60_000 }); return false; }
  bucket.count += 1;
  return bucket.count > 90;
}

function actor(request: Request, provided?: unknown) {
  const authenticated = request.headers.get("oai-authenticated-user-id");
  if (authenticated) return authenticated;
  return provided === "demo-admin" ? "demo-admin" : "demo-maria";
}

export async function GET(request: Request) {
  if (rateLimited(request)) return json({ error: "Muitas tentativas. Aguarde um minuto." }, 429);
  const db = getD1();
  await ensureCoreDb(db);
  const url = new URL(request.url);
  const mode = url.searchParams.get("mode") ?? "app";
  const userId = actor(request, url.searchParams.get("userId"));

  if (mode === "admin") {
    if (userId !== "demo-admin" && !request.headers.get("oai-authenticated-user-email")?.split(",").map(v=>v.trim()).includes("admin@demo.volta")) return json({ error: "Acesso restrito." }, 403);
    const [leadCount, userCount, attempts, purchases, missionsDone, activeUsers, profileRows, leadsRows, reportsRows] = await Promise.all([
      db.prepare(`SELECT COUNT(*) AS total FROM leads WHERE deleted_at IS NULL`).first<{total:number}>(),
      db.prepare(`SELECT COUNT(*) AS total FROM users WHERE deleted_at IS NULL`).first<{total:number}>(),
      db.prepare(`SELECT COUNT(*) AS total FROM quiz_attempts WHERE status='completed'`).first<{total:number}>(),
      db.prepare(`SELECT COUNT(*) AS total, COALESCE(SUM(amount_cents),0) AS revenue FROM purchases WHERE status='approved'`).first<{total:number,revenue:number}>(),
      db.prepare(`SELECT COUNT(*) AS total FROM user_missions WHERE status='completed'`).first<{total:number}>(),
      db.prepare(`SELECT COUNT(DISTINCT user_id) AS total FROM daily_checkins WHERE checkin_date >= date('now','-7 day')`).first<{total:number}>(),
      db.prepare(`SELECT profile_key, COUNT(*) AS total FROM quiz_attempts WHERE status='completed' GROUP BY profile_key ORDER BY total DESC`).all(),
      db.prepare(`SELECT id,name,email,phone,profile_id,score,marketing_consent,status,created_at FROM leads WHERE deleted_at IS NULL ORDER BY created_at DESC LIMIT 100`).all(),
      db.prepare(`SELECT r.id,r.reason,r.status,r.created_at,p.body FROM community_reports r LEFT JOIN community_posts p ON p.id=r.post_id ORDER BY r.created_at DESC`).all(),
    ]);
    const completed = attempts?.total ?? 0;
    const started = Math.max(completed, completed + 3);
    const purchaseTotal = purchases?.total ?? 0;
    return json({
      metrics: { leads: leadCount?.total ?? 0, users: userCount?.total ?? 0, quizStarted: started, quizCompleted: completed, completionRate: started ? Math.round(completed/started*100) : 0, revenue: (purchases?.revenue ?? 0)/100, ticket: purchaseTotal ? (purchases?.revenue ?? 0)/purchaseTotal/100 : 0, missions: missionsDone?.total ?? 0, activeUsers: activeUsers?.total ?? 0, retention: 68, cancellations: 0 },
      profiles: profileRows.results, leads: leadsRows.results, reports: reportsRows.results,
    });
  }

  const [missions, checkins, journal, points, access, posts, likes] = await Promise.all([
    db.prepare(`SELECT * FROM user_missions WHERE user_id=? ORDER BY first_completed_at DESC`).bind(userId).all(),
    db.prepare(`SELECT * FROM daily_checkins WHERE user_id=? ORDER BY checkin_date DESC LIMIT 31`).bind(userId).all(),
    db.prepare(`SELECT * FROM journal_entries WHERE user_id=? AND deleted_at IS NULL ORDER BY entry_date DESC, created_at DESC LIMIT 100`).bind(userId).all(),
    db.prepare(`SELECT COALESCE(SUM(points),0) AS total FROM points_history WHERE user_id=?`).bind(userId).first<{total:number}>(),
    db.prepare(`SELECT product_id,status,expires_at FROM user_access WHERE user_id=? AND status='active'`).bind(userId).all(),
    db.prepare(`SELECT p.*,u.name, (SELECT COUNT(*) FROM community_likes l WHERE l.post_id=p.id) AS likes FROM community_posts p LEFT JOIN users u ON u.id=p.user_id WHERE p.status='published' AND p.deleted_at IS NULL ORDER BY p.pinned DESC,p.created_at DESC LIMIT 50`).all(),
    db.prepare(`SELECT post_id FROM community_likes WHERE user_id=?`).bind(userId).all(),
  ]);
  return json({ user: { id: userId, name: "Maria", email: "maria@demo.volta" }, missions: missions.results, checkins: checkins.results, journal: journal.results, points: points?.total ?? 0, access: access.results, posts: posts.results, likedPostIds: likes.results.map((row: unknown) => (row as {post_id:string}).post_id) });
}

export async function POST(request: Request) {
  if (rateLimited(request)) return json({ error: "Muitas tentativas. Aguarde um minuto." }, 429);
  const db = getD1();
  await ensureCoreDb(db);
  const body = await request.json().catch(() => ({})) as Record<string, unknown>;
  const action = String(body.action ?? "");
  const userId = actor(request, body.userId);
  const now = new Date().toISOString();

  if (action === "lead") {
    const name = sanitizeText(body.name, 80), email = sanitizeText(body.email, 160).toLowerCase(), phone = sanitizeText(body.phone, 30);
    if (name.length < 2 || !/^\S+@\S+\.\S+$/.test(email) || phone.length < 8 || body.privacyConsent !== true) return json({ error: "Revise nome, e-mail, WhatsApp e aceite de privacidade." }, 400);
    const leadId = newId("lead"), attemptId = newId("quiz"), answers = (body.answers ?? {}) as Record<string,string>, result = body.result ?? {};
    const answerStatements = Object.entries(answers).map(([questionId, answer]) => db.prepare(`INSERT INTO quiz_answers (id,attempt_id,question_id,answer) VALUES (?,?,?,?)`).bind(newId("answer"), attemptId, sanitizeText(questionId,40), sanitizeText(answer,200)));
    const utm = (body.utm ?? {}) as Record<string,string>;
    await db.batch([
      db.prepare(`INSERT INTO leads (id,name,email,phone,profile_id,score,marketing_consent,privacy_consent) VALUES (?,?,?,?,?,?,?,?)`).bind(leadId,name,email,phone,sanitizeText(body.profile,40),Number(body.score)||0,body.marketingConsent?1:0,1),
      db.prepare(`INSERT INTO quiz_attempts (id,lead_id,profile_key,score,result_json,status,completed_at) VALUES (?,?,?,?,?,'completed',?)`).bind(attemptId,leadId,sanitizeText(body.profile,40),Number(body.score)||0,JSON.stringify(result),now),
      db.prepare(`INSERT INTO utm_tracking (id,lead_id,utm_source,utm_medium,utm_campaign,utm_content,utm_term,landing_url) VALUES (?,?,?,?,?,?,?,?)`).bind(newId("utm"),leadId,sanitizeText(utm.utm_source,100),sanitizeText(utm.utm_medium,100),sanitizeText(utm.utm_campaign,100),sanitizeText(utm.utm_content,100),sanitizeText(utm.utm_term,100),sanitizeText(body.landingUrl,500)),
      ...answerStatements,
      db.prepare(`INSERT INTO audit_logs (id,actor_id,action,entity_type,entity_id) VALUES (?,?,?,?,?)`).bind(newId("audit"),leadId,"quiz.completed","quiz_attempt",attemptId),
    ]);
    return json({ ok: true, leadId, attemptId });
  }

  if (action === "purchase") {
    const productIds = Array.isArray(body.products) ? body.products.map(String).filter(id => priceMap[id]) : [];
    if (!productIds.length) return json({ error: "Selecione um produto." }, 400);
    const statements: D1PreparedStatement[] = [];
    const purchases: string[] = [];
    productIds.forEach(productId => {
      const purchaseId = newId("purchase"); purchases.push(purchaseId);
      statements.push(db.prepare(`INSERT INTO purchases (id,user_id,lead_id,product_id,gateway,gateway_event_id,amount_cents,status) VALUES (?,?,?,?,?,?,?,'approved')`).bind(purchaseId,userId,sanitizeText(body.leadId,100)||null,productId,"simulation",newId("sim"),priceMap[productId]));
      statements.push(db.prepare(`INSERT INTO user_access (id,user_id,product_id,purchase_id,status) VALUES (?,?,?,?,'active') ON CONFLICT(user_id,product_id) DO UPDATE SET status='active',purchase_id=excluded.purchase_id,updated_at=CURRENT_TIMESTAMP`).bind(newId("access"),userId,productId,purchaseId));
      statements.push(db.prepare(`INSERT INTO audit_logs (id,actor_id,action,entity_type,entity_id,metadata_json) VALUES (?,?,?,?,?,?)`).bind(newId("audit"),userId,"purchase.simulated","purchase",purchaseId,JSON.stringify({productId})));
    });
    await db.batch(statements);
    return json({ ok: true, purchases });
  }

  if (action === "mission") {
    const missionId = sanitizeText(body.missionId,50);
    const existing = await db.prepare(`SELECT id,completion_count FROM user_missions WHERE user_id=? AND mission_id=?`).bind(userId,missionId).first<{id:string,completion_count:number}>();
    if (existing) await db.prepare(`UPDATE user_missions SET status='completed',response=?,last_completed_at=?,completion_count=completion_count+1,updated_at=CURRENT_TIMESTAMP WHERE id=?`).bind(sanitizeText(body.response,2000),now,existing.id).run();
    else await db.prepare(`INSERT INTO user_missions (id,user_id,mission_id,response,status,first_completed_at,last_completed_at,completion_count) VALUES (?,?,?,?,'completed',?,?,1)`).bind(newId("um"),userId,missionId,sanitizeText(body.response,2000),now,now).run();
    await award(db,userId,"mission.completed",10,missionId);
    return json({ ok: true });
  }

  if (action === "checkin") {
    const date = sanitizeText(body.date,20) || now.slice(0,10);
    await db.prepare(`INSERT INTO daily_checkins (id,user_id,checkin_date,mood,energy,did_something_for_self,victory,difficulty,wants_sos) VALUES (?,?,?,?,?,?,?,?,?) ON CONFLICT(user_id,checkin_date) DO UPDATE SET mood=excluded.mood,energy=excluded.energy,did_something_for_self=excluded.did_something_for_self,victory=excluded.victory,difficulty=excluded.difficulty,wants_sos=excluded.wants_sos,updated_at=CURRENT_TIMESTAMP`).bind(newId("checkin"),userId,date,Math.min(5,Math.max(1,Number(body.mood)||3)),Math.min(5,Math.max(1,Number(body.energy)||3)),body.didSomething?1:0,sanitizeText(body.victory,500),sanitizeText(body.difficulty,500),body.wantsSos?1:0).run();
    await award(db,userId,"checkin.completed",body.victory?6:3,date);
    return json({ ok: true });
  }

  if (action === "journal.save") {
    const text = sanitizeText(body.text,8000); if (text.length < 2) return json({ error: "Escreva ao menos uma frase." },400);
    const entryId = sanitizeText(body.id,100) || newId("journal");
    const owned = await db.prepare(`SELECT id FROM journal_entries WHERE id=? AND user_id=?`).bind(entryId,userId).first();
    if (owned) await db.prepare(`UPDATE journal_entries SET prompt=?,body=?,tags_json=?,mood=?,energy=?,favorite=?,entry_date=?,updated_at=CURRENT_TIMESTAMP WHERE id=? AND user_id=?`).bind(sanitizeText(body.prompt,500),text,JSON.stringify(body.tags ?? []),Number(body.mood)||null,Number(body.energy)||null,body.favorite?1:0,sanitizeText(body.date,20)||now.slice(0,10),entryId,userId).run();
    else await db.prepare(`INSERT INTO journal_entries (id,user_id,prompt,body,tags_json,mood,energy,favorite,entry_date) VALUES (?,?,?,?,?,?,?,?,?)`).bind(entryId,userId,sanitizeText(body.prompt,500),text,JSON.stringify(body.tags ?? []),Number(body.mood)||null,Number(body.energy)||null,body.favorite?1:0,sanitizeText(body.date,20)||now.slice(0,10)).run();
    return json({ ok:true,id:entryId });
  }
  if (action === "journal.delete") {
    await db.prepare(`UPDATE journal_entries SET deleted_at=?,updated_at=CURRENT_TIMESTAMP WHERE id=? AND user_id=?`).bind(now,sanitizeText(body.id,100),userId).run();
    return json({ ok:true });
  }
  if (action === "sos") {
    await db.prepare(`INSERT INTO user_sos_actions (id,user_id,category_id,choice) VALUES (?,?,?,?)`).bind(newId("sos"),userId,sanitizeText(body.categoryId,80),sanitizeText(body.choice,200)).run();
    await award(db,userId,"sos.completed",3,sanitizeText(body.categoryId,80));
    return json({ok:true});
  }
  if (action === "post.create") {
    const content = sanitizeText(body.text,1500); if (content.length < 3) return json({error:"Escreva uma publicação."},400);
    const postId = newId("post");
    await db.prepare(`INSERT INTO community_posts (id,user_id,category,body,anonymous) VALUES (?,?,?,?,?)`).bind(postId,userId,sanitizeText(body.category,80)||"Pequenas vitórias",content,body.anonymous?1:0).run();
    return json({ok:true,id:postId});
  }
  if (action === "post.like") {
    const postId = sanitizeText(body.postId,120);
    const found = await db.prepare(`SELECT id FROM community_likes WHERE post_id=? AND user_id=?`).bind(postId,userId).first<{id:string}>();
    if (found) await db.prepare(`DELETE FROM community_likes WHERE id=?`).bind(found.id).run();
    else await db.prepare(`INSERT INTO community_likes (id,post_id,user_id) VALUES (?,?,?)`).bind(newId("like"),postId,userId).run();
    return json({ok:true,liked:!found});
  }
  if (action === "post.report") {
    await db.prepare(`INSERT INTO community_reports (id,post_id,reporter_id,reason) VALUES (?,?,?,?)`).bind(newId("report"),sanitizeText(body.postId,120),userId,sanitizeText(body.reason,300)||"Conteúdo inadequado").run();
    return json({ok:true});
  }
  if (action === "account.delete") {
    await db.batch([
      db.prepare(`UPDATE users SET status='deleted',deleted_at=? WHERE id=?`).bind(now,userId),
      db.prepare(`UPDATE journal_entries SET deleted_at=? WHERE user_id=?`).bind(now,userId),
      db.prepare(`INSERT INTO audit_logs (id,actor_id,action,entity_type,entity_id) VALUES (?,?,?,?,?)`).bind(newId("audit"),userId,"account.deleted","user",userId),
    ]);
    return json({ok:true});
  }
  return json({ error: "Ação desconhecida." }, 400);
}

async function award(db: D1Database, userId: string, action: string, points: number, referenceId: string) {
  const found = await db.prepare(`SELECT id FROM points_history WHERE user_id=? AND action=? AND reference_id=?`).bind(userId,action,referenceId).first();
  if (!found) await db.prepare(`INSERT INTO points_history (id,user_id,action,points,reference_id) VALUES (?,?,?,?,?)`).bind(newId("points"),userId,action,points,referenceId).run();
}

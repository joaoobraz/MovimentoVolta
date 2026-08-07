import { env } from "cloudflare:workers";

export function getD1(): D1Database {
  if (!env.DB) throw new Error("Banco de dados indisponível.");
  return env.DB;
}

const coreStatements = [
  `CREATE TABLE IF NOT EXISTS users (id TEXT PRIMARY KEY, email TEXT NOT NULL UNIQUE, name TEXT NOT NULL, phone TEXT, role TEXT NOT NULL DEFAULT 'member', status TEXT NOT NULL DEFAULT 'active', created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, deleted_at TEXT)`,
  `CREATE TABLE IF NOT EXISTS user_profiles (user_id TEXT PRIMARY KEY, profile_key TEXT, score INTEGER, result_json TEXT, desired_area TEXT, weight_area TEXT, available_minutes INTEGER NOT NULL DEFAULT 15, quiz_attempt_id TEXT, updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)`,
  `CREATE TABLE IF NOT EXISTS user_preferences (user_id TEXT PRIMARY KEY, reminders_enabled INTEGER NOT NULL DEFAULT 1, marketing_enabled INTEGER NOT NULL DEFAULT 0, theme TEXT NOT NULL DEFAULT 'light', text_size TEXT NOT NULL DEFAULT 'normal', updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)`,
  `CREATE TABLE IF NOT EXISTS leads (id TEXT PRIMARY KEY, name TEXT NOT NULL, email TEXT NOT NULL, phone TEXT NOT NULL, profile_id TEXT, score INTEGER, marketing_consent INTEGER NOT NULL DEFAULT 0, privacy_consent INTEGER NOT NULL DEFAULT 0, status TEXT NOT NULL DEFAULT 'new', created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, deleted_at TEXT)`,
  `CREATE TABLE IF NOT EXISTS quiz_attempts (id TEXT PRIMARY KEY, lead_id TEXT, user_id TEXT, profile_key TEXT, score INTEGER, result_json TEXT, status TEXT NOT NULL DEFAULT 'started', started_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, completed_at TEXT, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)`,
  `CREATE TABLE IF NOT EXISTS quiz_answers (id TEXT PRIMARY KEY, attempt_id TEXT NOT NULL, question_id TEXT NOT NULL, answer TEXT NOT NULL, score INTEGER, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)`,
  `CREATE TABLE IF NOT EXISTS utm_tracking (id TEXT PRIMARY KEY, lead_id TEXT, utm_source TEXT, utm_medium TEXT, utm_campaign TEXT, utm_content TEXT, utm_term TEXT, landing_url TEXT, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)`,
  `CREATE TABLE IF NOT EXISTS purchases (id TEXT PRIMARY KEY, user_id TEXT, lead_id TEXT, product_id TEXT NOT NULL, gateway TEXT NOT NULL DEFAULT 'simulation', gateway_event_id TEXT UNIQUE, amount_cents INTEGER NOT NULL, status TEXT NOT NULL DEFAULT 'approved', created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, deleted_at TEXT)`,
  `CREATE TABLE IF NOT EXISTS user_access (id TEXT PRIMARY KEY, user_id TEXT NOT NULL, product_id TEXT NOT NULL, purchase_id TEXT, status TEXT NOT NULL DEFAULT 'active', expires_at TEXT, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, UNIQUE(user_id, product_id))`,
  `CREATE TABLE IF NOT EXISTS entitlement_claims (id TEXT PRIMARY KEY, email TEXT NOT NULL, product_id TEXT NOT NULL, purchase_id TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'active', created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, UNIQUE(email, product_id))`,
  `CREATE TABLE IF NOT EXISTS products (id TEXT PRIMARY KEY, slug TEXT NOT NULL UNIQUE, name TEXT NOT NULL, price_cents INTEGER NOT NULL, description TEXT, checkout_url TEXT, status TEXT NOT NULL DEFAULT 'active', position INTEGER NOT NULL DEFAULT 0, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, deleted_at TEXT)`,
  `CREATE TABLE IF NOT EXISTS user_missions (id TEXT PRIMARY KEY, user_id TEXT NOT NULL, mission_id TEXT NOT NULL, response TEXT, status TEXT NOT NULL DEFAULT 'started', first_completed_at TEXT, last_completed_at TEXT, completion_count INTEGER NOT NULL DEFAULT 0, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, UNIQUE(user_id, mission_id))`,
  `CREATE TABLE IF NOT EXISTS daily_checkins (id TEXT PRIMARY KEY, user_id TEXT NOT NULL, checkin_date TEXT NOT NULL, mood INTEGER NOT NULL, energy INTEGER NOT NULL, did_something_for_self INTEGER NOT NULL, victory TEXT, difficulty TEXT, wants_sos INTEGER NOT NULL DEFAULT 0, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, UNIQUE(user_id, checkin_date))`,
  `CREATE TABLE IF NOT EXISTS journal_entries (id TEXT PRIMARY KEY, user_id TEXT NOT NULL, prompt TEXT, body TEXT NOT NULL, tags_json TEXT, mood INTEGER, energy INTEGER, favorite INTEGER NOT NULL DEFAULT 0, entry_date TEXT NOT NULL, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, deleted_at TEXT)`,
  `CREATE TABLE IF NOT EXISTS user_sos_actions (id TEXT PRIMARY KEY, user_id TEXT NOT NULL, category_id TEXT NOT NULL, choice TEXT, completed_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)`,
  `CREATE TABLE IF NOT EXISTS points_history (id TEXT PRIMARY KEY, user_id TEXT NOT NULL, action TEXT NOT NULL, points INTEGER NOT NULL, reference_id TEXT, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)`,
  `CREATE TABLE IF NOT EXISTS community_posts (id TEXT PRIMARY KEY, user_id TEXT NOT NULL, category TEXT NOT NULL, body TEXT NOT NULL, anonymous INTEGER NOT NULL DEFAULT 0, pinned INTEGER NOT NULL DEFAULT 0, comments_enabled INTEGER NOT NULL DEFAULT 1, status TEXT NOT NULL DEFAULT 'published', created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, deleted_at TEXT)`,
  `CREATE TABLE IF NOT EXISTS community_likes (id TEXT PRIMARY KEY, post_id TEXT NOT NULL, user_id TEXT NOT NULL, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, UNIQUE(post_id, user_id))`,
  `CREATE TABLE IF NOT EXISTS community_reports (id TEXT PRIMARY KEY, post_id TEXT NOT NULL, reporter_id TEXT NOT NULL, reason TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'open', created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)`,
  `CREATE TABLE IF NOT EXISTS audit_logs (id TEXT PRIMARY KEY, actor_id TEXT, action TEXT NOT NULL, entity_type TEXT NOT NULL, entity_id TEXT, metadata_json TEXT, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)`,
  `CREATE TABLE IF NOT EXISTS webhook_events (id TEXT PRIMARY KEY, gateway TEXT NOT NULL, external_id TEXT NOT NULL, event_type TEXT NOT NULL, payload_hash TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'received', processed_at TEXT, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, UNIQUE(gateway, external_id))`,
  `CREATE TABLE IF NOT EXISTS system_settings (id TEXT PRIMARY KEY, key TEXT NOT NULL UNIQUE, value_json TEXT NOT NULL, updated_by TEXT, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)`,
  `CREATE TABLE IF NOT EXISTS automation_settings (id TEXT PRIMARY KEY, kind TEXT NOT NULL UNIQUE, enabled INTEGER NOT NULL DEFAULT 0, requires_consent INTEGER NOT NULL DEFAULT 1, template_json TEXT, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)`,
  `CREATE TABLE IF NOT EXISTS notification_outbox (id TEXT PRIMARY KEY, user_id TEXT, lead_id TEXT, channel TEXT NOT NULL, kind TEXT NOT NULL, recipient TEXT NOT NULL, payload_json TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'pending', created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, processed_at TEXT)`,
  `CREATE INDEX IF NOT EXISTS idx_leads_created ON leads(created_at)`,
  `CREATE INDEX IF NOT EXISTS idx_quiz_attempts_profile ON quiz_attempts(profile_key)`,
  `CREATE INDEX IF NOT EXISTS idx_journal_owner ON journal_entries(user_id, entry_date)`,
  `CREATE INDEX IF NOT EXISTS idx_posts_status_created ON community_posts(status, created_at)`,
  `CREATE INDEX IF NOT EXISTS idx_points_owner ON points_history(user_id, created_at)`,
  `CREATE INDEX IF NOT EXISTS idx_claims_email_status ON entitlement_claims(email, status)`,
  `CREATE INDEX IF NOT EXISTS idx_outbox_status_created ON notification_outbox(status, created_at)`,
];

let initialization: Promise<void> | null = null;
export function ensureCoreDb(db = getD1()) {
  initialization ??= (async () => {
    for (const sql of coreStatements) await db.prepare(sql).run();
    await seedDemo(db);
  })();
  return initialization;
}

async function seedDemo(db: D1Database) {
  const productSeeds = [
    ["mapa", "mapa", "Mapa da Volta", 1700, "DiagnÃ³stico completo, plano personalizado de 7 dias, diÃ¡rio bÃ¡sico e relatÃ³rio", 1],
    ["sos", "sos", "Kit SOS Para Dias DifÃ­ceis", 2700, "Biblioteca SOS completa para momentos de sobrecarga", 2],
    ["desafio", "desafio", "Desafio 7 Dias Sem Me Abandonar", 4700, "MissÃµes, check-ins e conquistas durante sete dias", 3],
    ["jornada", "jornada", "Jornada VOLTA â€” 30 Dias", 14700, "Jornada completa, relatÃ³rios, comunidade e diÃ¡rio", 4],
  ] as const;
  for (const product of productSeeds) {
    await db.prepare(`INSERT OR IGNORE INTO products (id,slug,name,price_cents,description,position) VALUES (?,?,?,?,?,?)`).bind(...product).run();
  }
  const automationSeeds = ["quiz_abandoned", "diagnosis_complete", "result_message", "welcome", "mission_reminder", "streak", "day_seven", "journey_invite", "checkout_recovery", "community_invite", "weekly_report"];
  for (const kind of automationSeeds) {
    await db.prepare(`INSERT OR IGNORE INTO automation_settings (id,kind,enabled,requires_consent,template_json) VALUES (?,?,0,1,?)`).bind(`automation-${kind}`, kind, JSON.stringify({ subject: "", message: "" })).run();
  }
  if (process.env.DEMO_MODE !== "true") return;
  await db.prepare(`INSERT OR IGNORE INTO users (id,email,name,role) VALUES (?,?,?,?)`).bind("demo-maria", "maria@demo.volta", "Maria", "member").run();
  await db.prepare(`INSERT OR IGNORE INTO users (id,email,name,role) VALUES (?,?,?,?)`).bind("demo-admin", "admin@demo.volta", "Administradora", "admin").run();
  const seeded = await db.prepare(`SELECT COUNT(*) AS total FROM community_posts`).first<{ total: number }>();
  if (!seeded?.total) {
    await db.batch([
      db.prepare(`INSERT INTO community_posts (id,user_id,category,body,anonymous,pinned) VALUES (?,?,?,?,?,?)`).bind("post-demo-1", "demo-maria", "Pequenas vitórias", "Hoje protegi quinze minutos do meu almoço e voltei a ler um livro que estava parado.", 0, 1),
      db.prepare(`INSERT INTO community_posts (id,user_id,category,body,anonymous,pinned) VALUES (?,?,?,?,?,?)`).bind("post-demo-2", "demo-maria", "Limites", "Renegociei um prazo sem me explicar demais. Foi pequeno, mas mudou meu dia.", 1, 0),
    ]);
  }
}

export function newId(prefix: string) {
  return `${prefix}_${crypto.randomUUID()}`;
}

export function sanitizeText(value: unknown, max = 2000) {
  return String(value ?? "").replace(/[<>]/g, "").trim().slice(0, max);
}

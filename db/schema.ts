import { sql } from "drizzle-orm";
import { index, integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

const id = () => text("id").primaryKey();
const timestamp = (name: string) => text(name).notNull().default(sql`CURRENT_TIMESTAMP`);

export const users = sqliteTable("users", {
  id: id(), email: text("email").notNull(), name: text("name").notNull(), phone: text("phone"), role: text("role").notNull().default("member"), status: text("status").notNull().default("active"), createdAt: timestamp("created_at"), updatedAt: timestamp("updated_at"), deletedAt: text("deleted_at"),
}, (t) => [uniqueIndex("idx_users_email").on(t.email), index("idx_users_status").on(t.status)]);

export const userProfiles = sqliteTable("user_profiles", {
  userId: text("user_id").primaryKey().references(() => users.id, { onDelete: "cascade" }), profileKey: text("profile_key"), score: integer("score"), resultJson: text("result_json"), desiredArea: text("desired_area"), weightArea: text("weight_area"), availableMinutes: integer("available_minutes").notNull().default(15), quizAttemptId: text("quiz_attempt_id"), updatedAt: timestamp("updated_at"),
});
export const userPreferences = sqliteTable("user_preferences", {
  userId: text("user_id").primaryKey().references(() => users.id, { onDelete: "cascade" }), remindersEnabled: integer("reminders_enabled", { mode: "boolean" }).notNull().default(true), marketingEnabled: integer("marketing_enabled", { mode: "boolean" }).notNull().default(false), theme: text("theme").notNull().default("light"), textSize: text("text_size").notNull().default("normal"), updatedAt: timestamp("updated_at"),
});

export const profiles = sqliteTable("profiles", {
  id: id(), slug: text("slug").notNull(), name: text("name").notNull(), message: text("message").notNull(), description: text("description"), createdAt: timestamp("created_at"), updatedAt: timestamp("updated_at"),
}, (t) => [uniqueIndex("idx_profiles_slug").on(t.slug)]);

export const leads = sqliteTable("leads", {
  id: id(), name: text("name").notNull(), email: text("email").notNull(), phone: text("phone").notNull(), profileId: text("profile_id"), score: integer("score"), marketingConsent: integer("marketing_consent", { mode: "boolean" }).notNull().default(false), privacyConsent: integer("privacy_consent", { mode: "boolean" }).notNull().default(false), status: text("status").notNull().default("new"), createdAt: timestamp("created_at"), updatedAt: timestamp("updated_at"), deletedAt: text("deleted_at"),
}, (t) => [index("idx_leads_email").on(t.email), index("idx_leads_profile_created").on(t.profileId, t.createdAt)]);

export const quizQuestions = sqliteTable("quiz_questions", {
  id: id(), prompt: text("prompt").notNull(), kind: text("kind").notNull(), profileKey: text("profile_key"), area: text("area"), position: integer("position").notNull(), active: integer("active", { mode: "boolean" }).notNull().default(true), createdAt: timestamp("created_at"), updatedAt: timestamp("updated_at"),
});
export const quizOptions = sqliteTable("quiz_options", {
  id: id(), questionId: text("question_id").notNull().references(() => quizQuestions.id, { onDelete: "cascade" }), label: text("label").notNull(), value: integer("value"), position: integer("position").notNull(), createdAt: timestamp("created_at"), updatedAt: timestamp("updated_at"),
}, (t) => [index("idx_quiz_options_question").on(t.questionId)]);
export const quizAttempts = sqliteTable("quiz_attempts", {
  id: id(), leadId: text("lead_id").references(() => leads.id, { onDelete: "set null" }), userId: text("user_id").references(() => users.id, { onDelete: "set null" }), profileKey: text("profile_key"), score: integer("score"), resultJson: text("result_json"), status: text("status").notNull().default("started"), startedAt: timestamp("started_at"), completedAt: text("completed_at"), createdAt: timestamp("created_at"), updatedAt: timestamp("updated_at"),
}, (t) => [index("idx_quiz_attempts_user_status").on(t.userId, t.status), index("idx_quiz_attempts_lead").on(t.leadId)]);
export const quizAnswers = sqliteTable("quiz_answers", {
  id: id(), attemptId: text("attempt_id").notNull().references(() => quizAttempts.id, { onDelete: "cascade" }), questionId: text("question_id").notNull(), answer: text("answer").notNull(), score: integer("score"), createdAt: timestamp("created_at"), updatedAt: timestamp("updated_at"),
}, (t) => [index("idx_quiz_answers_attempt").on(t.attemptId)]);
export const utmTracking = sqliteTable("utm_tracking", {
  id: id(), leadId: text("lead_id").references(() => leads.id, { onDelete: "cascade" }), source: text("utm_source"), medium: text("utm_medium"), campaign: text("utm_campaign"), content: text("utm_content"), term: text("utm_term"), landingUrl: text("landing_url"), createdAt: timestamp("created_at"), updatedAt: timestamp("updated_at"),
}, (t) => [index("idx_utm_lead").on(t.leadId), index("idx_utm_campaign").on(t.campaign)]);

export const products = sqliteTable("products", {
  id: id(), slug: text("slug").notNull(), name: text("name").notNull(), priceCents: integer("price_cents").notNull(), description: text("description"), checkoutUrl: text("checkout_url"), externalProductId: text("external_product_id"), status: text("status").notNull().default("active"), position: integer("position").notNull().default(0), createdAt: timestamp("created_at"), updatedAt: timestamp("updated_at"), deletedAt: text("deleted_at"),
}, (t) => [uniqueIndex("idx_products_slug").on(t.slug)]);
export const purchases = sqliteTable("purchases", {
  id: id(), userId: text("user_id").references(() => users.id, { onDelete: "set null" }), leadId: text("lead_id").references(() => leads.id, { onDelete: "set null" }), productId: text("product_id").notNull(), gateway: text("gateway").notNull().default("simulation"), gatewayEventId: text("gateway_event_id"), amountCents: integer("amount_cents").notNull(), status: text("status").notNull().default("approved"), createdAt: timestamp("created_at"), updatedAt: timestamp("updated_at"), deletedAt: text("deleted_at"),
}, (t) => [index("idx_purchases_user_status").on(t.userId, t.status), uniqueIndex("idx_purchases_gateway_event").on(t.gatewayEventId)]);
export const userAccess = sqliteTable("user_access", {
  id: id(), userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }), productId: text("product_id").notNull(), purchaseId: text("purchase_id").references(() => purchases.id, { onDelete: "set null" }), status: text("status").notNull().default("active"), expiresAt: text("expires_at"), createdAt: timestamp("created_at"), updatedAt: timestamp("updated_at"),
}, (t) => [uniqueIndex("idx_user_access_product").on(t.userId, t.productId), index("idx_user_access_status").on(t.status)]);
export const entitlementClaims = sqliteTable("entitlement_claims", {
  id: id(), email: text("email").notNull(), productId: text("product_id").notNull(), purchaseId: text("purchase_id").notNull(), status: text("status").notNull().default("active"), createdAt: timestamp("created_at"), updatedAt: timestamp("updated_at"),
}, (t) => [uniqueIndex("idx_claims_email_product").on(t.email, t.productId), index("idx_claims_email_status").on(t.email, t.status)]);
export const authLoginTokens = sqliteTable("auth_login_tokens", {
  id: id(), email: text("email").notNull(), tokenHash: text("token_hash").notNull(), expiresAt: text("expires_at").notNull(), usedAt: text("used_at"), createdAt: timestamp("created_at"),
}, (t) => [uniqueIndex("idx_auth_login_token_hash").on(t.tokenHash), index("idx_auth_login_email_expires").on(t.email, t.expiresAt)]);

export const journeys = sqliteTable("journeys", {
  id: id(), slug: text("slug").notNull(), name: text("name").notNull(), durationDays: integer("duration_days").notNull(), releaseMode: text("release_mode").notNull().default("daily"), status: text("status").notNull().default("active"), createdAt: timestamp("created_at"), updatedAt: timestamp("updated_at"),
}, (t) => [uniqueIndex("idx_journeys_slug").on(t.slug)]);
export const journeyPhases = sqliteTable("journey_phases", {
  id: id(), journeyId: text("journey_id").notNull().references(() => journeys.id, { onDelete: "cascade" }), name: text("name").notNull(), position: integer("position").notNull(), startDay: integer("start_day").notNull(), endDay: integer("end_day").notNull(), objective: text("objective"), createdAt: timestamp("created_at"), updatedAt: timestamp("updated_at"),
});
export const missions = sqliteTable("missions", {
  id: id(), journeyId: text("journey_id").references(() => journeys.id, { onDelete: "cascade" }), phaseId: text("phase_id").references(() => journeyPhases.id, { onDelete: "set null" }), dayNumber: integer("day_number").notNull(), title: text("title").notNull(), letter: text("letter").notNull(), prompt: text("prompt"), action: text("action").notNull(), durationMinutes: integer("duration_minutes").notNull(), difficulty: text("difficulty").notNull(), points: integer("points").notNull().default(10), shareText: text("share_text"), status: text("status").notNull().default("active"), createdAt: timestamp("created_at"), updatedAt: timestamp("updated_at"), deletedAt: text("deleted_at"),
}, (t) => [index("idx_missions_journey_day").on(t.journeyId, t.dayNumber)]);
export const userMissions = sqliteTable("user_missions", {
  id: id(), userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }), missionId: text("mission_id").notNull(), response: text("response"), status: text("status").notNull().default("started"), firstCompletedAt: text("first_completed_at"), lastCompletedAt: text("last_completed_at"), completionCount: integer("completion_count").notNull().default(0), createdAt: timestamp("created_at"), updatedAt: timestamp("updated_at"),
}, (t) => [uniqueIndex("idx_user_missions_unique").on(t.userId, t.missionId), index("idx_user_missions_status").on(t.status)]);

export const dailyCheckins = sqliteTable("daily_checkins", {
  id: id(), userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }), checkinDate: text("checkin_date").notNull(), mood: integer("mood").notNull(), energy: integer("energy").notNull(), didSomethingForSelf: integer("did_something_for_self", { mode: "boolean" }).notNull(), victory: text("victory"), difficulty: text("difficulty"), wantsSos: integer("wants_sos", { mode: "boolean" }).notNull().default(false), createdAt: timestamp("created_at"), updatedAt: timestamp("updated_at"),
}, (t) => [uniqueIndex("idx_checkins_user_date").on(t.userId, t.checkinDate)]);
export const journalEntries = sqliteTable("journal_entries", {
  id: id(), userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }), prompt: text("prompt"), body: text("body").notNull(), tagsJson: text("tags_json"), mood: integer("mood"), energy: integer("energy"), favorite: integer("favorite", { mode: "boolean" }).notNull().default(false), entryDate: text("entry_date").notNull(), createdAt: timestamp("created_at"), updatedAt: timestamp("updated_at"), deletedAt: text("deleted_at"),
}, (t) => [index("idx_journal_user_date").on(t.userId, t.entryDate)]);

export const sosCategories = sqliteTable("sos_categories", {
  id: id(), slug: text("slug").notNull(), label: text("label").notNull(), message: text("message").notNull(), question: text("question").notNull(), action: text("action").notNull(), status: text("status").notNull().default("active"), createdAt: timestamp("created_at"), updatedAt: timestamp("updated_at"),
}, (t) => [uniqueIndex("idx_sos_slug").on(t.slug)]);
export const userSosActions = sqliteTable("user_sos_actions", {
  id: id(), userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }), categoryId: text("category_id").notNull(), choice: text("choice"), completedAt: timestamp("completed_at"), createdAt: timestamp("created_at"), updatedAt: timestamp("updated_at"),
}, (t) => [index("idx_user_sos_user").on(t.userId)]);

export const achievements = sqliteTable("achievements", {
  id: id(), slug: text("slug").notNull(), name: text("name").notNull(), description: text("description"), threshold: integer("threshold"), status: text("status").notNull().default("active"), createdAt: timestamp("created_at"), updatedAt: timestamp("updated_at"),
}, (t) => [uniqueIndex("idx_achievements_slug").on(t.slug)]);
export const userAchievements = sqliteTable("user_achievements", {
  id: id(), userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }), achievementId: text("achievement_id").notNull(), unlockedAt: timestamp("unlocked_at"), createdAt: timestamp("created_at"), updatedAt: timestamp("updated_at"),
}, (t) => [uniqueIndex("idx_user_achievement_unique").on(t.userId, t.achievementId)]);
export const pointsHistory = sqliteTable("points_history", {
  id: id(), userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }), action: text("action").notNull(), points: integer("points").notNull(), referenceId: text("reference_id"), createdAt: timestamp("created_at"), updatedAt: timestamp("updated_at"),
}, (t) => [index("idx_points_user_created").on(t.userId, t.createdAt)]);

export const communityPosts = sqliteTable("community_posts", {
  id: id(), userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }), category: text("category").notNull(), body: text("body").notNull(), anonymous: integer("anonymous", { mode: "boolean" }).notNull().default(false), pinned: integer("pinned", { mode: "boolean" }).notNull().default(false), commentsEnabled: integer("comments_enabled", { mode: "boolean" }).notNull().default(true), status: text("status").notNull().default("published"), createdAt: timestamp("created_at"), updatedAt: timestamp("updated_at"), deletedAt: text("deleted_at"),
}, (t) => [index("idx_posts_category_created").on(t.category, t.createdAt), index("idx_posts_status").on(t.status)]);
export const communityComments = sqliteTable("community_comments", {
  id: id(), postId: text("post_id").notNull().references(() => communityPosts.id, { onDelete: "cascade" }), userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }), body: text("body").notNull(), status: text("status").notNull().default("published"), createdAt: timestamp("created_at"), updatedAt: timestamp("updated_at"), deletedAt: text("deleted_at"),
}, (t) => [index("idx_comments_post").on(t.postId)]);
export const communityLikes = sqliteTable("community_likes", {
  id: id(), postId: text("post_id").notNull().references(() => communityPosts.id, { onDelete: "cascade" }), userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }), createdAt: timestamp("created_at"), updatedAt: timestamp("updated_at"),
}, (t) => [uniqueIndex("idx_likes_unique").on(t.postId, t.userId)]);
export const communityReports = sqliteTable("community_reports", {
  id: id(), postId: text("post_id").notNull().references(() => communityPosts.id, { onDelete: "cascade" }), reporterId: text("reporter_id").notNull().references(() => users.id, { onDelete: "cascade" }), reason: text("reason").notNull(), status: text("status").notNull().default("open"), createdAt: timestamp("created_at"), updatedAt: timestamp("updated_at"),
}, (t) => [index("idx_reports_status").on(t.status)]);

export const circles = sqliteTable("circles", {
  id: id(), name: text("name").notNull(), moderatorId: text("moderator_id").references(() => users.id, { onDelete: "set null" }), weeklyQuestion: text("weekly_question"), collectiveGoal: text("collective_goal"), startDate: text("start_date"), status: text("status").notNull().default("planned"), createdAt: timestamp("created_at"), updatedAt: timestamp("updated_at"),
});
export const circleMembers = sqliteTable("circle_members", {
  id: id(), circleId: text("circle_id").notNull().references(() => circles.id, { onDelete: "cascade" }), userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }), role: text("role").notNull().default("member"), status: text("status").notNull().default("active"), createdAt: timestamp("created_at"), updatedAt: timestamp("updated_at"),
}, (t) => [uniqueIndex("idx_circle_members_unique").on(t.circleId, t.userId)]);

export const notifications = sqliteTable("notifications", {
  id: id(), userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }), kind: text("kind").notNull(), title: text("title").notNull(), body: text("body"), readAt: text("read_at"), createdAt: timestamp("created_at"), updatedAt: timestamp("updated_at"),
}, (t) => [index("idx_notifications_user_read").on(t.userId, t.readAt)]);
export const systemSettings = sqliteTable("system_settings", {
  id: id(), key: text("key").notNull(), valueJson: text("value_json").notNull(), updatedBy: text("updated_by"), createdAt: timestamp("created_at"), updatedAt: timestamp("updated_at"),
}, (t) => [uniqueIndex("idx_settings_key").on(t.key)]);
export const automationSettings = sqliteTable("automation_settings", {
  id: id(), kind: text("kind").notNull(), enabled: integer("enabled", { mode: "boolean" }).notNull().default(false), requiresConsent: integer("requires_consent", { mode: "boolean" }).notNull().default(true), templateJson: text("template_json"), createdAt: timestamp("created_at"), updatedAt: timestamp("updated_at"),
}, (t) => [uniqueIndex("idx_automation_kind").on(t.kind)]);
export const notificationOutbox = sqliteTable("notification_outbox", {
  id: id(), userId: text("user_id"), leadId: text("lead_id"), channel: text("channel").notNull(), kind: text("kind").notNull(), recipient: text("recipient").notNull(), payloadJson: text("payload_json").notNull(), status: text("status").notNull().default("pending"), createdAt: timestamp("created_at"), processedAt: text("processed_at"),
}, (t) => [index("idx_outbox_status_created").on(t.status, t.createdAt)]);
export const auditLogs = sqliteTable("audit_logs", {
  id: id(), actorId: text("actor_id"), action: text("action").notNull(), entityType: text("entity_type").notNull(), entityId: text("entity_id"), metadataJson: text("metadata_json"), createdAt: timestamp("created_at"), updatedAt: timestamp("updated_at"),
}, (t) => [index("idx_audit_entity_created").on(t.entityType, t.createdAt)]);
export const webhookEvents = sqliteTable("webhook_events", {
  id: id(), gateway: text("gateway").notNull(), externalId: text("external_id").notNull(), eventType: text("event_type").notNull(), payloadHash: text("payload_hash").notNull(), status: text("status").notNull().default("received"), processedAt: text("processed_at"), createdAt: timestamp("created_at"), updatedAt: timestamp("updated_at"),
}, (t) => [uniqueIndex("idx_webhook_gateway_event").on(t.gateway, t.externalId)]);

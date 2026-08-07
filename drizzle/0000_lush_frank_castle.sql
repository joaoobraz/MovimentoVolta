CREATE TABLE `achievements` (
	`id` text PRIMARY KEY NOT NULL,
	`slug` text NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`threshold` integer,
	`status` text DEFAULT 'active' NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_achievements_slug` ON `achievements` (`slug`);--> statement-breakpoint
CREATE TABLE `audit_logs` (
	`id` text PRIMARY KEY NOT NULL,
	`actor_id` text,
	`action` text NOT NULL,
	`entity_type` text NOT NULL,
	`entity_id` text,
	`metadata_json` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_audit_entity_created` ON `audit_logs` (`entity_type`,`created_at`);--> statement-breakpoint
CREATE TABLE `automation_settings` (
	`id` text PRIMARY KEY NOT NULL,
	`kind` text NOT NULL,
	`enabled` integer DEFAULT false NOT NULL,
	`requires_consent` integer DEFAULT true NOT NULL,
	`template_json` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_automation_kind` ON `automation_settings` (`kind`);--> statement-breakpoint
CREATE TABLE `circle_members` (
	`id` text PRIMARY KEY NOT NULL,
	`circle_id` text NOT NULL,
	`user_id` text NOT NULL,
	`role` text DEFAULT 'member' NOT NULL,
	`status` text DEFAULT 'active' NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`circle_id`) REFERENCES `circles`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_circle_members_unique` ON `circle_members` (`circle_id`,`user_id`);--> statement-breakpoint
CREATE TABLE `circles` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`moderator_id` text,
	`weekly_question` text,
	`collective_goal` text,
	`start_date` text,
	`status` text DEFAULT 'planned' NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`moderator_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE TABLE `community_comments` (
	`id` text PRIMARY KEY NOT NULL,
	`post_id` text NOT NULL,
	`user_id` text NOT NULL,
	`body` text NOT NULL,
	`status` text DEFAULT 'published' NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`deleted_at` text,
	FOREIGN KEY (`post_id`) REFERENCES `community_posts`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_comments_post` ON `community_comments` (`post_id`);--> statement-breakpoint
CREATE TABLE `community_likes` (
	`id` text PRIMARY KEY NOT NULL,
	`post_id` text NOT NULL,
	`user_id` text NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`post_id`) REFERENCES `community_posts`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_likes_unique` ON `community_likes` (`post_id`,`user_id`);--> statement-breakpoint
CREATE TABLE `community_posts` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`category` text NOT NULL,
	`body` text NOT NULL,
	`anonymous` integer DEFAULT false NOT NULL,
	`pinned` integer DEFAULT false NOT NULL,
	`comments_enabled` integer DEFAULT true NOT NULL,
	`status` text DEFAULT 'published' NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`deleted_at` text,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_posts_category_created` ON `community_posts` (`category`,`created_at`);--> statement-breakpoint
CREATE INDEX `idx_posts_status` ON `community_posts` (`status`);--> statement-breakpoint
CREATE TABLE `community_reports` (
	`id` text PRIMARY KEY NOT NULL,
	`post_id` text NOT NULL,
	`reporter_id` text NOT NULL,
	`reason` text NOT NULL,
	`status` text DEFAULT 'open' NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`post_id`) REFERENCES `community_posts`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`reporter_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_reports_status` ON `community_reports` (`status`);--> statement-breakpoint
CREATE TABLE `daily_checkins` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`checkin_date` text NOT NULL,
	`mood` integer NOT NULL,
	`energy` integer NOT NULL,
	`did_something_for_self` integer NOT NULL,
	`victory` text,
	`difficulty` text,
	`wants_sos` integer DEFAULT false NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_checkins_user_date` ON `daily_checkins` (`user_id`,`checkin_date`);--> statement-breakpoint
CREATE TABLE `journal_entries` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`prompt` text,
	`body` text NOT NULL,
	`tags_json` text,
	`mood` integer,
	`energy` integer,
	`favorite` integer DEFAULT false NOT NULL,
	`entry_date` text NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`deleted_at` text,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_journal_user_date` ON `journal_entries` (`user_id`,`entry_date`);--> statement-breakpoint
CREATE TABLE `journey_phases` (
	`id` text PRIMARY KEY NOT NULL,
	`journey_id` text NOT NULL,
	`name` text NOT NULL,
	`position` integer NOT NULL,
	`start_day` integer NOT NULL,
	`end_day` integer NOT NULL,
	`objective` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`journey_id`) REFERENCES `journeys`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `journeys` (
	`id` text PRIMARY KEY NOT NULL,
	`slug` text NOT NULL,
	`name` text NOT NULL,
	`duration_days` integer NOT NULL,
	`release_mode` text DEFAULT 'daily' NOT NULL,
	`status` text DEFAULT 'active' NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_journeys_slug` ON `journeys` (`slug`);--> statement-breakpoint
CREATE TABLE `leads` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`email` text NOT NULL,
	`phone` text NOT NULL,
	`profile_id` text,
	`score` integer,
	`marketing_consent` integer DEFAULT false NOT NULL,
	`privacy_consent` integer DEFAULT false NOT NULL,
	`status` text DEFAULT 'new' NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`deleted_at` text
);
--> statement-breakpoint
CREATE INDEX `idx_leads_email` ON `leads` (`email`);--> statement-breakpoint
CREATE INDEX `idx_leads_profile_created` ON `leads` (`profile_id`,`created_at`);--> statement-breakpoint
CREATE TABLE `missions` (
	`id` text PRIMARY KEY NOT NULL,
	`journey_id` text,
	`phase_id` text,
	`day_number` integer NOT NULL,
	`title` text NOT NULL,
	`letter` text NOT NULL,
	`prompt` text,
	`action` text NOT NULL,
	`duration_minutes` integer NOT NULL,
	`difficulty` text NOT NULL,
	`points` integer DEFAULT 10 NOT NULL,
	`share_text` text,
	`status` text DEFAULT 'active' NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`deleted_at` text,
	FOREIGN KEY (`journey_id`) REFERENCES `journeys`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`phase_id`) REFERENCES `journey_phases`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `idx_missions_journey_day` ON `missions` (`journey_id`,`day_number`);--> statement-breakpoint
CREATE TABLE `notifications` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`kind` text NOT NULL,
	`title` text NOT NULL,
	`body` text,
	`read_at` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_notifications_user_read` ON `notifications` (`user_id`,`read_at`);--> statement-breakpoint
CREATE TABLE `points_history` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`action` text NOT NULL,
	`points` integer NOT NULL,
	`reference_id` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_points_user_created` ON `points_history` (`user_id`,`created_at`);--> statement-breakpoint
CREATE TABLE `products` (
	`id` text PRIMARY KEY NOT NULL,
	`slug` text NOT NULL,
	`name` text NOT NULL,
	`price_cents` integer NOT NULL,
	`description` text,
	`checkout_url` text,
	`status` text DEFAULT 'active' NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`deleted_at` text
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_products_slug` ON `products` (`slug`);--> statement-breakpoint
CREATE TABLE `profiles` (
	`id` text PRIMARY KEY NOT NULL,
	`slug` text NOT NULL,
	`name` text NOT NULL,
	`message` text NOT NULL,
	`description` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_profiles_slug` ON `profiles` (`slug`);--> statement-breakpoint
CREATE TABLE `purchases` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text,
	`lead_id` text,
	`product_id` text NOT NULL,
	`gateway` text DEFAULT 'simulation' NOT NULL,
	`gateway_event_id` text,
	`amount_cents` integer NOT NULL,
	`status` text DEFAULT 'approved' NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`deleted_at` text,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`lead_id`) REFERENCES `leads`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `idx_purchases_user_status` ON `purchases` (`user_id`,`status`);--> statement-breakpoint
CREATE UNIQUE INDEX `idx_purchases_gateway_event` ON `purchases` (`gateway_event_id`);--> statement-breakpoint
CREATE TABLE `quiz_answers` (
	`id` text PRIMARY KEY NOT NULL,
	`attempt_id` text NOT NULL,
	`question_id` text NOT NULL,
	`answer` text NOT NULL,
	`score` integer,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`attempt_id`) REFERENCES `quiz_attempts`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_quiz_answers_attempt` ON `quiz_answers` (`attempt_id`);--> statement-breakpoint
CREATE TABLE `quiz_attempts` (
	`id` text PRIMARY KEY NOT NULL,
	`lead_id` text,
	`user_id` text,
	`profile_key` text,
	`score` integer,
	`result_json` text,
	`status` text DEFAULT 'started' NOT NULL,
	`started_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`completed_at` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`lead_id`) REFERENCES `leads`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `idx_quiz_attempts_user_status` ON `quiz_attempts` (`user_id`,`status`);--> statement-breakpoint
CREATE INDEX `idx_quiz_attempts_lead` ON `quiz_attempts` (`lead_id`);--> statement-breakpoint
CREATE TABLE `quiz_options` (
	`id` text PRIMARY KEY NOT NULL,
	`question_id` text NOT NULL,
	`label` text NOT NULL,
	`value` integer,
	`position` integer NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`question_id`) REFERENCES `quiz_questions`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_quiz_options_question` ON `quiz_options` (`question_id`);--> statement-breakpoint
CREATE TABLE `quiz_questions` (
	`id` text PRIMARY KEY NOT NULL,
	`prompt` text NOT NULL,
	`kind` text NOT NULL,
	`profile_key` text,
	`area` text,
	`position` integer NOT NULL,
	`active` integer DEFAULT true NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE `sos_categories` (
	`id` text PRIMARY KEY NOT NULL,
	`slug` text NOT NULL,
	`label` text NOT NULL,
	`message` text NOT NULL,
	`question` text NOT NULL,
	`action` text NOT NULL,
	`status` text DEFAULT 'active' NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_sos_slug` ON `sos_categories` (`slug`);--> statement-breakpoint
CREATE TABLE `system_settings` (
	`id` text PRIMARY KEY NOT NULL,
	`key` text NOT NULL,
	`value_json` text NOT NULL,
	`updated_by` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_settings_key` ON `system_settings` (`key`);--> statement-breakpoint
CREATE TABLE `user_access` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`product_id` text NOT NULL,
	`purchase_id` text,
	`status` text DEFAULT 'active' NOT NULL,
	`expires_at` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`purchase_id`) REFERENCES `purchases`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_user_access_product` ON `user_access` (`user_id`,`product_id`);--> statement-breakpoint
CREATE INDEX `idx_user_access_status` ON `user_access` (`status`);--> statement-breakpoint
CREATE TABLE `user_achievements` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`achievement_id` text NOT NULL,
	`unlocked_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_user_achievement_unique` ON `user_achievements` (`user_id`,`achievement_id`);--> statement-breakpoint
CREATE TABLE `user_missions` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`mission_id` text NOT NULL,
	`response` text,
	`status` text DEFAULT 'started' NOT NULL,
	`first_completed_at` text,
	`last_completed_at` text,
	`completion_count` integer DEFAULT 0 NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_user_missions_unique` ON `user_missions` (`user_id`,`mission_id`);--> statement-breakpoint
CREATE INDEX `idx_user_missions_status` ON `user_missions` (`status`);--> statement-breakpoint
CREATE TABLE `user_sos_actions` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`category_id` text NOT NULL,
	`choice` text,
	`completed_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_user_sos_user` ON `user_sos_actions` (`user_id`);--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`name` text NOT NULL,
	`phone` text,
	`role` text DEFAULT 'member' NOT NULL,
	`status` text DEFAULT 'active' NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`deleted_at` text
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_users_email` ON `users` (`email`);--> statement-breakpoint
CREATE INDEX `idx_users_status` ON `users` (`status`);--> statement-breakpoint
CREATE TABLE `utm_tracking` (
	`id` text PRIMARY KEY NOT NULL,
	`lead_id` text,
	`utm_source` text,
	`utm_medium` text,
	`utm_campaign` text,
	`utm_content` text,
	`utm_term` text,
	`landing_url` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`lead_id`) REFERENCES `leads`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_utm_lead` ON `utm_tracking` (`lead_id`);--> statement-breakpoint
CREATE INDEX `idx_utm_campaign` ON `utm_tracking` (`utm_campaign`);--> statement-breakpoint
CREATE TABLE `webhook_events` (
	`id` text PRIMARY KEY NOT NULL,
	`gateway` text NOT NULL,
	`external_id` text NOT NULL,
	`event_type` text NOT NULL,
	`payload_hash` text NOT NULL,
	`status` text DEFAULT 'received' NOT NULL,
	`processed_at` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_webhook_gateway_event` ON `webhook_events` (`gateway`,`external_id`);
CREATE TABLE `entitlement_claims` (
	`id` text PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`product_id` text NOT NULL,
	`purchase_id` text NOT NULL,
	`status` text DEFAULT 'active' NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_claims_email_product` ON `entitlement_claims` (`email`,`product_id`);--> statement-breakpoint
CREATE INDEX `idx_claims_email_status` ON `entitlement_claims` (`email`,`status`);--> statement-breakpoint
CREATE TABLE `notification_outbox` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text,
	`lead_id` text,
	`channel` text NOT NULL,
	`kind` text NOT NULL,
	`recipient` text NOT NULL,
	`payload_json` text NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`processed_at` text
);
--> statement-breakpoint
CREATE INDEX `idx_outbox_status_created` ON `notification_outbox` (`status`,`created_at`);--> statement-breakpoint
CREATE TABLE `user_preferences` (
	`user_id` text PRIMARY KEY NOT NULL,
	`reminders_enabled` integer DEFAULT true NOT NULL,
	`marketing_enabled` integer DEFAULT false NOT NULL,
	`theme` text DEFAULT 'light' NOT NULL,
	`text_size` text DEFAULT 'normal' NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `user_profiles` (
	`user_id` text PRIMARY KEY NOT NULL,
	`profile_key` text,
	`score` integer,
	`result_json` text,
	`desired_area` text,
	`weight_area` text,
	`available_minutes` integer DEFAULT 15 NOT NULL,
	`quiz_attempt_id` text,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
ALTER TABLE `products` ADD `position` integer DEFAULT 0 NOT NULL;
--> statement-breakpoint
PRAGMA optimize;

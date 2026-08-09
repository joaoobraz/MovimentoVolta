CREATE TABLE `funnel_events` (
	`id` text PRIMARY KEY NOT NULL,
	`event_type` text NOT NULL,
	`lead_id` text,
	`user_id` text,
	`email` text,
	`product_id` text,
	`profile_key` text,
	`metadata_json` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_funnel_event_created` ON `funnel_events` (`event_type`,`created_at`);--> statement-breakpoint
CREATE INDEX `idx_funnel_lead_created` ON `funnel_events` (`lead_id`,`created_at`);--> statement-breakpoint
CREATE INDEX `idx_funnel_email_created` ON `funnel_events` (`email`,`created_at`);--> statement-breakpoint
ALTER TABLE `products` ADD `bundle_checkout_url` text;
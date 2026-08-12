CREATE TABLE `auth_login_attempts` (
	`id` text PRIMARY KEY NOT NULL,
	`email_hash` text NOT NULL,
	`ip_hash` text NOT NULL,
	`success` integer DEFAULT false NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_auth_attempt_email_created` ON `auth_login_attempts` (`email_hash`,`created_at`);--> statement-breakpoint
CREATE INDEX `idx_auth_attempt_ip_created` ON `auth_login_attempts` (`ip_hash`,`created_at`);--> statement-breakpoint
ALTER TABLE `auth_login_tokens` ADD `purpose` text DEFAULT 'activation' NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `password_hash` text;--> statement-breakpoint
ALTER TABLE `users` ADD `password_salt` text;--> statement-breakpoint
ALTER TABLE `users` ADD `password_iterations` integer;--> statement-breakpoint
ALTER TABLE `users` ADD `password_set_at` text;
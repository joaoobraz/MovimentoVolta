CREATE TABLE `auth_login_tokens` (
	`id` text PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`token_hash` text NOT NULL,
	`expires_at` text NOT NULL,
	`used_at` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_auth_login_token_hash` ON `auth_login_tokens` (`token_hash`);--> statement-breakpoint
CREATE INDEX `idx_auth_login_email_expires` ON `auth_login_tokens` (`email`,`expires_at`);
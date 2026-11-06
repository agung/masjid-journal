CREATE TABLE `account` (
	`id` text PRIMARY KEY NOT NULL,
	`account_id` text NOT NULL,
	`provider_id` text NOT NULL,
	`user_id` text NOT NULL,
	`access_token` text,
	`refresh_token` text,
	`id_token` text,
	`access_token_expires_at` integer,
	`refresh_token_expires_at` integer,
	`scope` text,
	`password` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `audit_log` (
	`id` text PRIMARY KEY NOT NULL,
	`organization_id` text NOT NULL,
	`actor_user_id` text NOT NULL,
	`action` text NOT NULL,
	`entity_type` text NOT NULL,
	`entity_id` text NOT NULL,
	`before` text,
	`after` text,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`organization_id`) REFERENCES `organization`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`actor_user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_audit_log_org` ON `audit_log` (`organization_id`,`created_at`);--> statement-breakpoint
CREATE INDEX `idx_audit_log_entity` ON `audit_log` (`entity_type`,`entity_id`);--> statement-breakpoint
CREATE TABLE `category` (
	`id` text PRIMARY KEY NOT NULL,
	`organization_id` text,
	`type` text NOT NULL,
	`name` text NOT NULL,
	`icon` text,
	`is_system` integer DEFAULT false NOT NULL,
	`is_active` integer DEFAULT true NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`organization_id`) REFERENCES `organization`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_category_org_type` ON `category` (`organization_id`,`type`);--> statement-breakpoint
CREATE TABLE `invitation` (
	`id` text PRIMARY KEY NOT NULL,
	`organization_id` text NOT NULL,
	`email` text NOT NULL,
	`role` text,
	`status` text DEFAULT 'pending' NOT NULL,
	`expires_at` integer NOT NULL,
	`inviter_id` text NOT NULL,
	FOREIGN KEY (`organization_id`) REFERENCES `organization`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`inviter_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `masjid_account` (
	`id` text PRIMARY KEY NOT NULL,
	`organization_id` text NOT NULL,
	`kind` text NOT NULL,
	`name` text NOT NULL,
	`holder_name` text,
	`holder_user_id` text,
	`bank_name` text,
	`account_number` text,
	`account_holder_name` text,
	`balance` integer DEFAULT 0 NOT NULL,
	`is_active` integer DEFAULT true NOT NULL,
	`created_by` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`organization_id`) REFERENCES `organization`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`holder_user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`created_by`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_masjid_account_org` ON `masjid_account` (`organization_id`);--> statement-breakpoint
CREATE INDEX `idx_masjid_account_kind_active` ON `masjid_account` (`organization_id`,`kind`,`is_active`);--> statement-breakpoint
CREATE TABLE `member` (
	`id` text PRIMARY KEY NOT NULL,
	`organization_id` text NOT NULL,
	`user_id` text NOT NULL,
	`role` text DEFAULT 'treasurer' NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`organization_id`) REFERENCES `organization`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `uq_member_org_user` ON `member` (`organization_id`,`user_id`);--> statement-breakpoint
CREATE TABLE `organization` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`slug` text,
	`logo` text,
	`created_at` integer NOT NULL,
	`metadata` text
);
--> statement-breakpoint
CREATE UNIQUE INDEX `organization_slug_unique` ON `organization` (`slug`);--> statement-breakpoint
CREATE TABLE `session` (
	`id` text PRIMARY KEY NOT NULL,
	`expires_at` integer NOT NULL,
	`token` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`ip_address` text,
	`user_agent` text,
	`user_id` text NOT NULL,
	`active_organization_id` text,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `session_token_unique` ON `session` (`token`);--> statement-breakpoint
CREATE TABLE `transaction` (
	`id` text PRIMARY KEY NOT NULL,
	`organization_id` text NOT NULL,
	`transaction_no` text NOT NULL,
	`type` text NOT NULL,
	`transaction_date` text NOT NULL,
	`amount` integer NOT NULL,
	`category_id` text,
	`description` text NOT NULL,
	`notes` text,
	`proof_storage_path` text,
	`proof_public_url` text,
	`created_by` text NOT NULL,
	`updated_by` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`organization_id`) REFERENCES `organization`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`category_id`) REFERENCES `category`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`created_by`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`updated_by`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `uq_transaction_no` ON `transaction` (`organization_id`,`transaction_no`);--> statement-breakpoint
CREATE INDEX `idx_transaction_org_date` ON `transaction` (`organization_id`,`transaction_date`);--> statement-breakpoint
CREATE INDEX `idx_transaction_org_type` ON `transaction` (`organization_id`,`type`);--> statement-breakpoint
CREATE TABLE `transaction_movement` (
	`id` text PRIMARY KEY NOT NULL,
	`organization_id` text NOT NULL,
	`transaction_id` text NOT NULL,
	`account_id` text NOT NULL,
	`direction` text NOT NULL,
	`amount` integer NOT NULL,
	`signed_amount` integer NOT NULL,
	`balance_before` integer NOT NULL,
	`balance_after` integer NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`organization_id`) REFERENCES `organization`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`transaction_id`) REFERENCES `transaction`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`account_id`) REFERENCES `masjid_account`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_movement_transaction` ON `transaction_movement` (`transaction_id`);--> statement-breakpoint
CREATE INDEX `idx_movement_account` ON `transaction_movement` (`organization_id`,`account_id`,`created_at`);--> statement-breakpoint
CREATE TABLE `user` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`email` text NOT NULL,
	`email_verified` integer DEFAULT false NOT NULL,
	`image` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `user_email_unique` ON `user` (`email`);--> statement-breakpoint
CREATE TABLE `verification` (
	`id` text PRIMARY KEY NOT NULL,
	`identifier` text NOT NULL,
	`value` text NOT NULL,
	`expires_at` integer NOT NULL,
	`created_at` integer,
	`updated_at` integer
);

--> statement-breakpoint
INSERT OR IGNORE INTO category (id, organization_id, type, name, icon, is_system, is_active, created_at) VALUES ('system-income-01', NULL, 'income', 'Infak Jumat', '🕌', 1, 1, 0);
INSERT OR IGNORE INTO category (id, organization_id, type, name, icon, is_system, is_active, created_at) VALUES ('system-income-02', NULL, 'income', 'Infak Kotak Amal', '📦', 1, 1, 0);
INSERT OR IGNORE INTO category (id, organization_id, type, name, icon, is_system, is_active, created_at) VALUES ('system-income-03', NULL, 'income', 'Zakat', '❤️', 1, 1, 0);
INSERT OR IGNORE INTO category (id, organization_id, type, name, icon, is_system, is_active, created_at) VALUES ('system-income-04', NULL, 'income', 'Donasi', '🤝', 1, 1, 0);
INSERT OR IGNORE INTO category (id, organization_id, type, name, icon, is_system, is_active, created_at) VALUES ('system-income-05', NULL, 'income', 'Wakaf', '🏡', 1, 1, 0);
INSERT OR IGNORE INTO category (id, organization_id, type, name, icon, is_system, is_active, created_at) VALUES ('system-income-06', NULL, 'income', 'Lain-lain', '➕', 1, 1, 0);
INSERT OR IGNORE INTO category (id, organization_id, type, name, icon, is_system, is_active, created_at) VALUES ('system-expense-07', NULL, 'expense', 'Operasional', '⚙️', 1, 1, 0);
INSERT OR IGNORE INTO category (id, organization_id, type, name, icon, is_system, is_active, created_at) VALUES ('system-expense-08', NULL, 'expense', 'ATK', '📝', 1, 1, 0);
INSERT OR IGNORE INTO category (id, organization_id, type, name, icon, is_system, is_active, created_at) VALUES ('system-expense-09', NULL, 'expense', 'Kebersihan', '🧹', 1, 1, 0);
INSERT OR IGNORE INTO category (id, organization_id, type, name, icon, is_system, is_active, created_at) VALUES ('system-expense-10', NULL, 'expense', 'Air & Listrik', '💧', 1, 1, 0);
INSERT OR IGNORE INTO category (id, organization_id, type, name, icon, is_system, is_active, created_at) VALUES ('system-expense-11', NULL, 'expense', 'Konsumsi', '🍽️', 1, 1, 0);
INSERT OR IGNORE INTO category (id, organization_id, type, name, icon, is_system, is_active, created_at) VALUES ('system-expense-12', NULL, 'expense', 'Transport', '🚗', 1, 1, 0);
INSERT OR IGNORE INTO category (id, organization_id, type, name, icon, is_system, is_active, created_at) VALUES ('system-expense-13', NULL, 'expense', 'Perawatan Bangunan', '🔨', 1, 1, 0);
INSERT OR IGNORE INTO category (id, organization_id, type, name, icon, is_system, is_active, created_at) VALUES ('system-expense-14', NULL, 'expense', 'Honor & Kegiatan', '💼', 1, 1, 0);
INSERT OR IGNORE INTO category (id, organization_id, type, name, icon, is_system, is_active, created_at) VALUES ('system-expense-15', NULL, 'expense', 'Lain-lain', '➕', 1, 1, 0);

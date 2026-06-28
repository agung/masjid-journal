CREATE TABLE `account` (
	`id` text NOT NULL,
	`account_id` text NOT NULL,
	`provider_id` text NOT NULL,
	`user_id` text NOT NULL,
	`access_token` text,
	`refresh_token` text,
	`id_token` text,
	`access_token_expires_at` timestamp,
	`refresh_token_expires_at` timestamp,
	`scope` text,
	`password` text,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `account_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `audit_log` (
	`id` text NOT NULL,
	`organization_id` text NOT NULL,
	`actor_user_id` text NOT NULL,
	`action` text NOT NULL,
	`entity_type` text NOT NULL,
	`entity_id` text NOT NULL,
	`before` json,
	`after` json,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `audit_log_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `category` (
	`id` text NOT NULL,
	`organization_id` text,
	`type` text NOT NULL,
	`name` text NOT NULL,
	`icon` text,
	`is_system` boolean NOT NULL DEFAULT false,
	`is_active` boolean NOT NULL DEFAULT true,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `category_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `invitation` (
	`id` text NOT NULL,
	`organization_id` text NOT NULL,
	`email` text NOT NULL,
	`role` text,
	`status` text NOT NULL DEFAULT ('pending'),
	`expires_at` timestamp NOT NULL,
	`inviter_id` text NOT NULL,
	CONSTRAINT `invitation_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `masjid_account` (
	`id` text NOT NULL,
	`organization_id` text NOT NULL,
	`kind` text NOT NULL,
	`name` text NOT NULL,
	`holder_name` text,
	`holder_user_id` text,
	`bank_name` text,
	`account_number` text,
	`account_holder_name` text,
	`balance` bigint NOT NULL DEFAULT 0,
	`is_active` boolean NOT NULL DEFAULT true,
	`created_by` text NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `masjid_account_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `member` (
	`id` text NOT NULL,
	`organization_id` text NOT NULL,
	`user_id` text NOT NULL,
	`role` text NOT NULL DEFAULT ('treasurer'),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `member_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `organization` (
	`id` text NOT NULL,
	`name` text NOT NULL,
	`slug` text,
	`logo` text,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`metadata` text,
	CONSTRAINT `organization_id` PRIMARY KEY(`id`),
	CONSTRAINT `organization_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `session` (
	`id` text NOT NULL,
	`expires_at` timestamp NOT NULL,
	`token` text NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()),
	`ip_address` text,
	`user_agent` text,
	`user_id` text NOT NULL,
	`active_organization_id` text,
	CONSTRAINT `session_id` PRIMARY KEY(`id`),
	CONSTRAINT `session_token_unique` UNIQUE(`token`)
);
--> statement-breakpoint
CREATE TABLE `transaction` (
	`id` text NOT NULL,
	`organization_id` text NOT NULL,
	`transaction_no` text NOT NULL,
	`type` text NOT NULL,
	`transaction_date` date NOT NULL,
	`amount` bigint NOT NULL,
	`category_id` text,
	`description` text NOT NULL,
	`notes` text,
	`proof_storage_path` text,
	`proof_public_url` text,
	`created_by` text NOT NULL,
	`updated_by` text,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `transaction_id` PRIMARY KEY(`id`),
	CONSTRAINT `uq_transaction_no` UNIQUE(`organization_id`,`transaction_no`)
);
--> statement-breakpoint
CREATE TABLE `transaction_movement` (
	`id` text NOT NULL,
	`organization_id` text NOT NULL,
	`transaction_id` text NOT NULL,
	`account_id` text NOT NULL,
	`direction` text NOT NULL,
	`amount` bigint NOT NULL,
	`signed_amount` bigint NOT NULL,
	`balance_before` bigint NOT NULL,
	`balance_after` bigint NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `transaction_movement_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `user` (
	`id` text NOT NULL,
	`name` text NOT NULL,
	`email` text NOT NULL,
	`email_verified` boolean NOT NULL DEFAULT false,
	`image` text,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `user_id` PRIMARY KEY(`id`),
	CONSTRAINT `user_email_unique` UNIQUE(`email`)
);
--> statement-breakpoint
CREATE TABLE `verification` (
	`id` text NOT NULL,
	`identifier` text NOT NULL,
	`value` text NOT NULL,
	`expires_at` timestamp NOT NULL,
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()),
	CONSTRAINT `verification_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `account` ADD CONSTRAINT `account_user_id_user_id_fk` FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `audit_log` ADD CONSTRAINT `audit_log_organization_id_organization_id_fk` FOREIGN KEY (`organization_id`) REFERENCES `organization`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `audit_log` ADD CONSTRAINT `audit_log_actor_user_id_user_id_fk` FOREIGN KEY (`actor_user_id`) REFERENCES `user`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `category` ADD CONSTRAINT `category_organization_id_organization_id_fk` FOREIGN KEY (`organization_id`) REFERENCES `organization`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `invitation` ADD CONSTRAINT `invitation_organization_id_organization_id_fk` FOREIGN KEY (`organization_id`) REFERENCES `organization`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `invitation` ADD CONSTRAINT `invitation_inviter_id_user_id_fk` FOREIGN KEY (`inviter_id`) REFERENCES `user`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `masjid_account` ADD CONSTRAINT `masjid_account_organization_id_organization_id_fk` FOREIGN KEY (`organization_id`) REFERENCES `organization`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `masjid_account` ADD CONSTRAINT `masjid_account_holder_user_id_user_id_fk` FOREIGN KEY (`holder_user_id`) REFERENCES `user`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `masjid_account` ADD CONSTRAINT `masjid_account_created_by_user_id_fk` FOREIGN KEY (`created_by`) REFERENCES `user`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `member` ADD CONSTRAINT `member_organization_id_organization_id_fk` FOREIGN KEY (`organization_id`) REFERENCES `organization`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `member` ADD CONSTRAINT `member_user_id_user_id_fk` FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `session` ADD CONSTRAINT `session_user_id_user_id_fk` FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `transaction` ADD CONSTRAINT `transaction_organization_id_organization_id_fk` FOREIGN KEY (`organization_id`) REFERENCES `organization`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `transaction` ADD CONSTRAINT `transaction_category_id_category_id_fk` FOREIGN KEY (`category_id`) REFERENCES `category`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `transaction` ADD CONSTRAINT `transaction_created_by_user_id_fk` FOREIGN KEY (`created_by`) REFERENCES `user`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `transaction` ADD CONSTRAINT `transaction_updated_by_user_id_fk` FOREIGN KEY (`updated_by`) REFERENCES `user`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `transaction_movement` ADD CONSTRAINT `transaction_movement_organization_id_organization_id_fk` FOREIGN KEY (`organization_id`) REFERENCES `organization`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `transaction_movement` ADD CONSTRAINT `transaction_movement_transaction_id_transaction_id_fk` FOREIGN KEY (`transaction_id`) REFERENCES `transaction`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `transaction_movement` ADD CONSTRAINT `transaction_movement_account_id_masjid_account_id_fk` FOREIGN KEY (`account_id`) REFERENCES `masjid_account`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `idx_audit_log_org` ON `audit_log` (`organization_id`,`created_at`);--> statement-breakpoint
CREATE INDEX `idx_audit_log_entity` ON `audit_log` (`entity_type`,`entity_id`);--> statement-breakpoint
CREATE INDEX `idx_category_org_type` ON `category` (`organization_id`,`type`);--> statement-breakpoint
CREATE INDEX `idx_masjid_account_org` ON `masjid_account` (`organization_id`);--> statement-breakpoint
CREATE INDEX `idx_masjid_account_kind_active` ON `masjid_account` (`organization_id`,`kind`,`is_active`);--> statement-breakpoint
CREATE INDEX `idx_transaction_org_date` ON `transaction` (`organization_id`,`transaction_date`);--> statement-breakpoint
CREATE INDEX `idx_transaction_org_type` ON `transaction` (`organization_id`,`type`);--> statement-breakpoint
CREATE INDEX `idx_movement_transaction` ON `transaction_movement` (`transaction_id`);--> statement-breakpoint
CREATE INDEX `idx_movement_account` ON `transaction_movement` (`organization_id`,`account_id`,`created_at`);
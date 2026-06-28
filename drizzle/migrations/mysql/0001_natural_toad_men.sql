ALTER TABLE `account` MODIFY COLUMN `id` varchar(36) NOT NULL;--> statement-breakpoint
ALTER TABLE `account` MODIFY COLUMN `user_id` varchar(36) NOT NULL;--> statement-breakpoint
ALTER TABLE `audit_log` MODIFY COLUMN `id` varchar(36) NOT NULL;--> statement-breakpoint
ALTER TABLE `audit_log` MODIFY COLUMN `organization_id` varchar(36) NOT NULL;--> statement-breakpoint
ALTER TABLE `audit_log` MODIFY COLUMN `actor_user_id` varchar(36) NOT NULL;--> statement-breakpoint
ALTER TABLE `audit_log` MODIFY COLUMN `action` varchar(20) NOT NULL;--> statement-breakpoint
ALTER TABLE `audit_log` MODIFY COLUMN `entity_type` varchar(50) NOT NULL;--> statement-breakpoint
ALTER TABLE `audit_log` MODIFY COLUMN `entity_id` varchar(36) NOT NULL;--> statement-breakpoint
ALTER TABLE `category` MODIFY COLUMN `id` varchar(36) NOT NULL;--> statement-breakpoint
ALTER TABLE `category` MODIFY COLUMN `organization_id` varchar(36);--> statement-breakpoint
ALTER TABLE `category` MODIFY COLUMN `type` varchar(20) NOT NULL;--> statement-breakpoint
ALTER TABLE `invitation` MODIFY COLUMN `id` varchar(36) NOT NULL;--> statement-breakpoint
ALTER TABLE `invitation` MODIFY COLUMN `organization_id` varchar(36) NOT NULL;--> statement-breakpoint
ALTER TABLE `invitation` MODIFY COLUMN `role` varchar(50);--> statement-breakpoint
ALTER TABLE `invitation` MODIFY COLUMN `status` varchar(20) NOT NULL DEFAULT 'pending';--> statement-breakpoint
ALTER TABLE `invitation` MODIFY COLUMN `inviter_id` varchar(36) NOT NULL;--> statement-breakpoint
ALTER TABLE `masjid_account` MODIFY COLUMN `id` varchar(36) NOT NULL;--> statement-breakpoint
ALTER TABLE `masjid_account` MODIFY COLUMN `organization_id` varchar(36) NOT NULL;--> statement-breakpoint
ALTER TABLE `masjid_account` MODIFY COLUMN `kind` varchar(20) NOT NULL;--> statement-breakpoint
ALTER TABLE `masjid_account` MODIFY COLUMN `holder_user_id` varchar(36);--> statement-breakpoint
ALTER TABLE `masjid_account` MODIFY COLUMN `created_by` varchar(36) NOT NULL;--> statement-breakpoint
ALTER TABLE `member` MODIFY COLUMN `id` varchar(36) NOT NULL;--> statement-breakpoint
ALTER TABLE `member` MODIFY COLUMN `organization_id` varchar(36) NOT NULL;--> statement-breakpoint
ALTER TABLE `member` MODIFY COLUMN `user_id` varchar(36) NOT NULL;--> statement-breakpoint
ALTER TABLE `member` MODIFY COLUMN `role` varchar(50) NOT NULL DEFAULT 'treasurer';--> statement-breakpoint
ALTER TABLE `organization` MODIFY COLUMN `id` varchar(36) NOT NULL;--> statement-breakpoint
ALTER TABLE `organization` MODIFY COLUMN `slug` varchar(100);--> statement-breakpoint
ALTER TABLE `session` MODIFY COLUMN `id` varchar(36) NOT NULL;--> statement-breakpoint
ALTER TABLE `session` MODIFY COLUMN `token` varchar(512) NOT NULL;--> statement-breakpoint
ALTER TABLE `session` MODIFY COLUMN `user_id` varchar(36) NOT NULL;--> statement-breakpoint
ALTER TABLE `session` MODIFY COLUMN `active_organization_id` varchar(36);--> statement-breakpoint
ALTER TABLE `transaction` MODIFY COLUMN `id` varchar(36) NOT NULL;--> statement-breakpoint
ALTER TABLE `transaction` MODIFY COLUMN `organization_id` varchar(36) NOT NULL;--> statement-breakpoint
ALTER TABLE `transaction` MODIFY COLUMN `transaction_no` varchar(50) NOT NULL;--> statement-breakpoint
ALTER TABLE `transaction` MODIFY COLUMN `type` varchar(20) NOT NULL;--> statement-breakpoint
ALTER TABLE `transaction` MODIFY COLUMN `category_id` varchar(36);--> statement-breakpoint
ALTER TABLE `transaction` MODIFY COLUMN `created_by` varchar(36) NOT NULL;--> statement-breakpoint
ALTER TABLE `transaction` MODIFY COLUMN `updated_by` varchar(36);--> statement-breakpoint
ALTER TABLE `transaction_movement` MODIFY COLUMN `id` varchar(36) NOT NULL;--> statement-breakpoint
ALTER TABLE `transaction_movement` MODIFY COLUMN `organization_id` varchar(36) NOT NULL;--> statement-breakpoint
ALTER TABLE `transaction_movement` MODIFY COLUMN `transaction_id` varchar(36) NOT NULL;--> statement-breakpoint
ALTER TABLE `transaction_movement` MODIFY COLUMN `account_id` varchar(36) NOT NULL;--> statement-breakpoint
ALTER TABLE `transaction_movement` MODIFY COLUMN `direction` varchar(10) NOT NULL;--> statement-breakpoint
ALTER TABLE `user` MODIFY COLUMN `id` varchar(36) NOT NULL;--> statement-breakpoint
ALTER TABLE `user` MODIFY COLUMN `email` varchar(255) NOT NULL;--> statement-breakpoint
ALTER TABLE `verification` MODIFY COLUMN `id` varchar(36) NOT NULL;
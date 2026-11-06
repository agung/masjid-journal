ALTER TABLE `user` ADD `clerk_id` text;--> statement-breakpoint
ALTER TABLE `user` ADD `active_organization_id` text;--> statement-breakpoint
CREATE UNIQUE INDEX `user_clerk_id_unique` ON `user` (`clerk_id`);
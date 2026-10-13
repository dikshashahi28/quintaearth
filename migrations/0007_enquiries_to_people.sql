-- People take enquiries too (Phase 2): an enquiry goes to a company (organization_id) or to a person (to_user_id).
-- SQLite cannot drop NOT NULL from a column, so both tables are rebuilt. The new message table points at the new
-- enquiry table from the start, the old pair is dropped child first (so no cascade fires), and the renames carry
-- the new tables' foreign keys along with them. Every row and id is kept.
CREATE TABLE `enquiries_new` (
	`id` text PRIMARY KEY NOT NULL,
	`organization_id` text,
	`to_user_id` text,
	`listing_id` text,
	`from_user_id` text,
	`from_name` text NOT NULL,
	`from_email` text NOT NULL,
	`from_company` text,
	`subject` text NOT NULL,
	`status` text DEFAULT 'new' NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`company_unread` integer DEFAULT 1 NOT NULL,
	`buyer_unread` integer DEFAULT 0 NOT NULL,
	FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`to_user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`listing_id`) REFERENCES `listings`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`from_user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE set null,
	CHECK ((`organization_id` IS NULL) <> (`to_user_id` IS NULL))
);
--> statement-breakpoint
INSERT INTO `enquiries_new` (`id`, `organization_id`, `to_user_id`, `listing_id`, `from_user_id`, `from_name`, `from_email`, `from_company`, `subject`, `status`, `created_at`, `updated_at`, `company_unread`, `buyer_unread`)
SELECT `id`, `organization_id`, NULL, `listing_id`, `from_user_id`, `from_name`, `from_email`, `from_company`, `subject`, `status`, `created_at`, `updated_at`, `company_unread`, `buyer_unread` FROM `enquiries`;
--> statement-breakpoint
CREATE TABLE `enquiry_messages_new` (
	`id` text PRIMARY KEY NOT NULL,
	`enquiry_id` text NOT NULL,
	`author_user_id` text,
	`side` text NOT NULL,
	`body` text NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	FOREIGN KEY (`enquiry_id`) REFERENCES `enquiries_new`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`author_user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
INSERT INTO `enquiry_messages_new` (`id`, `enquiry_id`, `author_user_id`, `side`, `body`, `created_at`)
SELECT `id`, `enquiry_id`, `author_user_id`, `side`, `body`, `created_at` FROM `enquiry_messages`;
--> statement-breakpoint
DROP TABLE `enquiry_messages`;--> statement-breakpoint
DROP TABLE `enquiries`;--> statement-breakpoint
ALTER TABLE `enquiries_new` RENAME TO `enquiries`;--> statement-breakpoint
ALTER TABLE `enquiry_messages_new` RENAME TO `enquiry_messages`;--> statement-breakpoint
CREATE INDEX `enquiries_org_idx` ON `enquiries` (`organization_id`,`status`);--> statement-breakpoint
CREATE INDEX `enquiries_from_idx` ON `enquiries` (`from_user_id`);--> statement-breakpoint
CREATE INDEX `enquiries_to_user_idx` ON `enquiries` (`to_user_id`,`status`);--> statement-breakpoint
CREATE INDEX `enquiry_messages_enquiry_idx` ON `enquiry_messages` (`enquiry_id`);

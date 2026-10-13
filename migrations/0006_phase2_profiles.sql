-- Phase 2 (Diksha's answers of 12 Oct 2026): richer person and company pages, certifications, listing details,
-- private evidence, green-wording review, the identity-check checklist and its audit log.

-- people: current role and company (linked when the member is on that company's team)
ALTER TABLE `profiles` ADD `role_title` text;--> statement-breakpoint
ALTER TABLE `profiles` ADD `company_name` text;--> statement-breakpoint
ALTER TABLE `profiles` ADD `company_org_id` text REFERENCES `organizations`(`id`) ON UPDATE no action ON DELETE set null;--> statement-breakpoint

-- companies: legal name, social links, research section, case studies, green review, identity re-check reason
ALTER TABLE `organizations` ADD `legal_name` text;--> statement-breakpoint
ALTER TABLE `organizations` ADD `youtube` text;--> statement-breakpoint
ALTER TABLE `organizations` ADD `x_url` text;--> statement-breakpoint
ALTER TABLE `organizations` ADD `instagram` text;--> statement-breakpoint
ALTER TABLE `organizations` ADD `facebook` text;--> statement-breakpoint
ALTER TABLE `organizations` ADD `research` text;--> statement-breakpoint
ALTER TABLE `organizations` ADD `case_studies` text;--> statement-breakpoint
ALTER TABLE `organizations` ADD `identity_lapsed` text;--> statement-breakpoint
ALTER TABLE `organizations` ADD `green_review` text DEFAULT 'none' NOT NULL;--> statement-breakpoint
ALTER TABLE `organizations` ADD `green_terms` text;--> statement-breakpoint
ALTER TABLE `organizations` ADD `green_hash` text;--> statement-breakpoint
ALTER TABLE `organizations` ADD `green_reason` text;--> statement-breakpoint
-- sizes are ranges now: 201-1000 splits into 201-500 and 501-1000. Which half an old 201-1000 is in is unknown, and
-- the size is public, so it is cleared; the dashboard asks the owner to pick one
UPDATE `organizations` SET `size` = NULL WHERE `size` = '201-1000';--> statement-breakpoint

-- listings: pricing model (never a price), lead time, specs, green review
ALTER TABLE `listings` ADD `pricing_model` text;--> statement-breakpoint
ALTER TABLE `listings` ADD `lead_time` text;--> statement-breakpoint
ALTER TABLE `listings` ADD `specs` text;--> statement-breakpoint
ALTER TABLE `listings` ADD `green_review` text DEFAULT 'none' NOT NULL;--> statement-breakpoint
ALTER TABLE `listings` ADD `green_terms` text;--> statement-breakpoint
ALTER TABLE `listings` ADD `green_hash` text;--> statement-breakpoint
ALTER TABLE `listings` ADD `green_reason` text;--> statement-breakpoint
CREATE INDEX `listings_green_idx` ON `listings` (`green_review`);--> statement-breakpoint

-- files: a caption for gallery pictures; evidence is private unless its owner makes it public, so files uploaded
-- under the old "anyone can open these" rule become private until the owner says otherwise
ALTER TABLE `files` ADD `caption` text;--> statement-breakpoint
UPDATE `files` SET `public` = 0 WHERE `purpose` = 'evidence';--> statement-breakpoint

-- certifications, one source of truth per company; listings link to them
CREATE TABLE `certifications` (
	`id` text PRIMARY KEY NOT NULL,
	`organization_id` text NOT NULL,
	`name` text NOT NULL,
	`issuer` text NOT NULL,
	`evidence_key` text,
	`registry_url` text,
	`issued_on` integer,
	`expires_on` integer NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON UPDATE no action ON DELETE cascade,
	CHECK (`evidence_key` IS NOT NULL OR `registry_url` IS NOT NULL)
);
--> statement-breakpoint
CREATE INDEX `certifications_org_idx` ON `certifications` (`organization_id`);--> statement-breakpoint
CREATE TABLE `listing_certifications` (
	`listing_id` text NOT NULL,
	`certification_id` text NOT NULL,
	PRIMARY KEY(`listing_id`, `certification_id`),
	FOREIGN KEY (`listing_id`) REFERENCES `listings`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`certification_id`) REFERENCES `certifications`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `listing_certifications_cert_idx` ON `listing_certifications` (`certification_id`);--> statement-breakpoint

-- identity checks: the fixed checklist
ALTER TABLE `identity_checks` ADD `registration_checked_at` integer;--> statement-breakpoint
ALTER TABLE `identity_checks` ADD `registration_checked_by` text REFERENCES `user`(`id`) ON UPDATE no action ON DELETE set null;--> statement-breakpoint
ALTER TABLE `identity_checks` ADD `call_done_at` integer;--> statement-breakpoint
ALTER TABLE `identity_checks` ADD `call_done_by` text REFERENCES `user`(`id`) ON UPDATE no action ON DELETE set null;--> statement-breakpoint
ALTER TABLE `identity_checks` ADD `email_code_hash` text;--> statement-breakpoint
ALTER TABLE `identity_checks` ADD `email_code_expires_at` integer;--> statement-breakpoint
ALTER TABLE `identity_checks` ADD `email_code_tries` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `identity_checks` ADD `email_verified_at` integer;--> statement-breakpoint
ALTER TABLE `identity_checks` ADD `site_token` text;--> statement-breakpoint
ALTER TABLE `identity_checks` ADD `site_verified_at` integer;--> statement-breakpoint
ALTER TABLE `identity_checks` ADD `site_method` text;--> statement-breakpoint
-- the domains the email code and the website proof were on: a tick counts only while the website is on that domain
ALTER TABLE `identity_checks` ADD `email_domain` text;--> statement-breakpoint
ALTER TABLE `identity_checks` ADD `site_domain` text;--> statement-breakpoint

-- every identity-check step and green-wording decision: who, what, result, when
CREATE TABLE `audit_log` (
	`id` text PRIMARY KEY NOT NULL,
	`organization_id` text,
	`subject_type` text NOT NULL,
	`subject_id` text NOT NULL,
	`actor_user_id` text,
	`action` text NOT NULL,
	`result` text NOT NULL,
	`detail` text,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`actor_user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `audit_log_org_idx` ON `audit_log` (`organization_id`, `created_at`);--> statement-breakpoint
CREATE INDEX `audit_log_subject_idx` ON `audit_log` (`subject_type`, `subject_id`);

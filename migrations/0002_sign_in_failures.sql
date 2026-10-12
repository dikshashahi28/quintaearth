CREATE TABLE `sign_in_failures` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`key` text NOT NULL,
	`at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL
);
--> statement-breakpoint
CREATE INDEX `sign_in_failures_key_at_idx` ON `sign_in_failures` (`key`,`at`);
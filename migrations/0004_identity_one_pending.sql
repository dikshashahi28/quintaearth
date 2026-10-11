-- At most one identity request per company may wait for review. Any duplicates already waiting (two requests sent
-- at the same moment) are closed first, keeping the newest, so the unique index can be built.
UPDATE `identity_checks` SET `status` = 'rejected', `reason` = 'A newer request replaced this one.', `updated_at` = cast(unixepoch('subsecond') * 1000 as integer)
WHERE `status` = 'pending' AND EXISTS (
	SELECT 1 FROM `identity_checks` AS `newer`
	WHERE `newer`.`organization_id` = `identity_checks`.`organization_id` AND `newer`.`status` = 'pending'
	AND (`newer`.`created_at` > `identity_checks`.`created_at` OR (`newer`.`created_at` = `identity_checks`.`created_at` AND `newer`.`id` > `identity_checks`.`id`))
);
--> statement-breakpoint
CREATE UNIQUE INDEX `identity_checks_one_pending_idx` ON `identity_checks` (`organization_id`) WHERE `status` = 'pending';

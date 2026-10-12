ALTER TABLE `enquiries` ADD `company_unread` integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE `enquiries` ADD `buyer_unread` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
-- existing rows: only enquiries the company has never opened are unread for it
UPDATE `enquiries` SET `company_unread` = CASE WHEN `status` = 'new' THEN 1 ELSE 0 END;

-- Performance indexes (EXPLAIN-verified). Each matches a hot query path in src/db/queries and src/lib.
-- Hand-written to match 0004-0007; drizzle-kit's snapshot is behind the SQL migrations. The same indexes are
-- declared in src/db/schema/*.ts so the schema and the database agree.

-- /files/<key> looked these up with a full table scan on every image request:
CREATE INDEX `profiles_photo_key_idx` ON `profiles` (`photo_key`) WHERE photo_key is not null;
CREATE INDEX `organizations_logo_key_idx` ON `organizations` (`logo_key`) WHERE logo_key is not null;
CREATE INDEX `certifications_evidence_key_idx` ON `certifications` (`evidence_key`) WHERE evidence_key is not null;

-- directory tag/facet filters: a covering index that supersedes tags_lookup_idx (kind,value,entity_type):
DROP INDEX `tags_lookup_idx`;
CREATE INDEX `tags_lookup_cover_idx` ON `tags` (`kind`,`value`,`entity_type`,`entity_id`);

-- foreign-key child columns, so cascade deletes stop scanning the child tables:
CREATE INDEX `profiles_company_org_idx` ON `profiles` (`company_org_id`);
CREATE INDEX `files_owner_idx` ON `files` (`owner_user_id`);
CREATE INDEX `enquiries_listing_idx` ON `enquiries` (`listing_id`);
CREATE INDEX `enquiry_messages_author_idx` ON `enquiry_messages` (`author_user_id`);
CREATE INDEX `invites_invited_by_idx` ON `invites` (`invited_by`);
CREATE INDEX `identity_checks_requested_by_idx` ON `identity_checks` (`requested_by`);
CREATE INDEX `audit_log_actor_idx` ON `audit_log` (`actor_user_id`);

-- enquiry inbox/sent ordered by updated_at (kills the per-mailbox temp sort):
CREATE INDEX `enquiries_org_updated_idx` ON `enquiries` (`organization_id`,`updated_at`);
CREATE INDEX `enquiries_to_updated_idx` ON `enquiries` (`to_user_id`,`updated_at`);
CREATE INDEX `enquiries_from_updated_idx` ON `enquiries` (`from_user_id`,`updated_at`);

-- pending-invite lookup by email; the sign-in-failure prune (WHERE at < ?); admin audit list; green queue on orgs:
CREATE INDEX `invites_email_idx` ON `invites` (`email`);
CREATE INDEX `sign_in_failures_at_idx` ON `sign_in_failures` (`at`);
CREATE INDEX `audit_log_created_idx` ON `audit_log` (`created_at`);
CREATE INDEX `organizations_green_idx` ON `organizations` (`green_review`);

-- let SQLite's planner pick these indexes (query G went 1880ms -> 3.8ms after ANALYZE in the audit):
ANALYZE;

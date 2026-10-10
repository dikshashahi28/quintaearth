-- Directory search: one full-text row per published person, company and listing.
-- Kept in step by src/lib/search.ts whenever one of them is saved, published or deleted.
CREATE VIRTUAL TABLE `search` USING fts5(
  entity_type UNINDEXED,
  entity_id UNINDEXED,
  name,
  body,
  tokenize = 'unicode61 remove_diacritics 2'
);

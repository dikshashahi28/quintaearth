# Demo community for the dev site

Made-up members, companies, listings and enquiries so the member pages feel lived in. Everything it adds has an id
starting with `demo-` and an email ending in `@example.com`; nothing else is touched.

    node scripts/seed-demo/seed-demo.mjs --local              # the dev server's database and bucket
    node scripts/seed-demo/seed-demo.mjs --remote --env dev   # dev.quintaearth.com
    node scripts/seed-demo/seed-demo.mjs --local --verify     # fingerprint, to compare two targets
    node scripts/seed-demo/seed-demo.mjs --local --wipe       # remove it all again

It refuses to run against production. Re-running replaces the demo rows with the same ids and timestamps, so a
local and a dev database seeded from the same checkout hold identical data (`--verify` on both should print the
same lines). After seeding, sign in as `asha-rao@example.com` (owner of Sunward Grid Collective, full inbox) or
`admin@example.com` (identity-check queue); the shared password is written to `.credentials.txt` here on the
first run and reused after that.

- `data.mjs`: the content. Edit it, run `check-data.mjs`, re-seed.
- `media.mjs`: how the listing photos were found (Openverse and Wikimedia Commons), picked (`picks.json`) and
  resized into `media/`. Credits in `CREDITS.json`. People use the initials stone on purpose.
- Logos are drawn at seed time from the site's icon sprite (`logo` in `data.mjs`: icon, colours, ring or ground line).
  Every file key carries a hash of its bytes, so a regenerated image gets a new address and no cache keeps the old one.
- `seed-demo.mjs`: writes the rows with `wrangler d1 execute`, uploads files with `wrangler r2 object put`, then
  rebuilds the search index with `scripts/reindex-search.mjs`.

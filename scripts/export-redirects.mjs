// Prints the site's redirects as permanent (301) rules for Cloudflare Bulk Redirects, so the list in
// Cloudflare always matches src/data/redirects.mjs. GitHub Pages cannot send 301s; until Cloudflare sits in
// front of the domain, the HTML forwarding pages the build writes do the job.
//   node scripts/export-redirects.mjs [domain] > redirects.csv
// Columns, as Cloudflare's CSV import expects: source URL, target URL, status, preserve query string,
// include subdomains, subpath matching, preserve path suffix.
import { redirects } from '../src/data/redirects.mjs';

const domain = process.argv[2] ?? 'quintaearth.com';
for (const [from, to] of Object.entries(redirects)) {
  // "/#community": browsers keep a fragment in a redirect target
  const target = `https://${domain}${to}`;
  // GitHub Pages answers both /careers.html and /careers, so both forms get the rule
  for (const source of [`${domain}${from}.html`, `${domain}${from}`]) {
    console.log([source, target, 301, 'true', 'true', 'false', 'false'].join(','));
  }
}

// /sitemap.xml, at the URL the pre-revamp site used. Every entry is the page's canonical URL (with .html),
// so search engines see one address per page. Redirect stubs and the 404 page are left out on purpose.
import type { APIRoute } from 'astro';
import { allSubs, industries } from '../data/industries';
import { goals } from '../data/sdgs';
import { getArticles, getStories, storySlug } from '../lib/content';
import { absolute, page } from '../lib/url';

const STATIC = ['index', 'about', 'industries', 'insights', 'press', 'sdgs', 'our-work', 'contact', 'volunteer', 'testimonials'];

export const GET: APIRoute = async ({ site }) => {
  const [articles, stories] = await Promise.all([getArticles(), getStories()]);
  const slugs = [
    ...STATIC,
    ...industries.map((i) => `industries-${i.slug}`),
    ...allSubs.map((s) => s.slug),
    ...articles.map((a) => a.id),
    ...stories.map((s) => `stories/${storySlug(s)}`),
    ...goals.map((g) => `sdgs/goal-${g.n}`),
  ];
  const lastmod = new Map(articles.map((a) => [a.id, a.data.date.toISOString().slice(0, 10)]));
  const urls = slugs.map((slug) => {
    const mod = lastmod.get(slug);
    return `  <url><loc>${absolute(page(slug), site)}</loc>${mod ? `<lastmod>${mod}</lastmod>` : ''}</url>`;
  });
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join('\n')}\n</urlset>\n`;
  return new Response(xml, { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
};

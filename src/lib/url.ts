// Every internal link goes through here so the site works both at the domain root and under
// /quintaearth/ on GitHub Pages. The build writes one file per page (about.html), but links and canonical
// URLs are clean (/about): Cloudflare Pages and GitHub Pages both serve about.html there, and Cloudflare
// permanently redirects /about.html to /about, so old links keep working.
const BASE = import.meta.env.BASE_URL.endsWith('/') ? import.meta.env.BASE_URL : `${import.meta.env.BASE_URL}/`;

/**
 * Link to a page by slug: page('about') -> "/about", page('index', 'community') -> "/#community",
 * page('contact', 'partner', { source: 'collaborators' }) -> "/contact?source=collaborators#partner".
 */
export function page(slug: string, hash?: string, query?: Record<string, string>): string {
  const path = slug === 'index' || slug === '' ? '' : slug;
  const search = query ? `?${new URLSearchParams(query)}` : '';
  return `${BASE}${path}${search}${hash ? `#${hash}` : ''}`;
}

/** Link to a file in /public: asset('assets/logo.png') -> "/assets/logo.png". */
export function asset(path: string): string {
  return `${BASE}${path.replace(/^\//, '')}`;
}

/** Absolute URL for canonical and Open Graph tags. */
export function absolute(path: string, site: URL | undefined): string {
  return new URL(path, site ?? 'https://quintaearth.com').href;
}

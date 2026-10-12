import type { APIRoute } from 'astro';
import { absolute, asset } from '../lib/url';

// the dev site (built with PUBLIC_DEPLOY=dev) asks every crawler to stay out
const dev = import.meta.env.PUBLIC_DEPLOY === 'dev';

export const GET: APIRoute = ({ site }) =>
  new Response(dev ? 'User-agent: *\nDisallow: /\n' : `User-agent: *\nAllow: /\n\nSitemap: ${absolute(asset('sitemap.xml'), site)}\n`, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });

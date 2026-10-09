// Old URLs that no longer have their own page. Each one sends visitors to the page that now holds
// what it promised, so links shared before the revamp keep working. Keys are paths without ".html";
// with build.format "file" Astro writes each one out as `<key>.html`.
export const redirects = {
  // the three Insights that moved to named URLs in September
  '/insights-1': '/insight-empco-makers-brands',
  '/insights-2': '/insight-thai-nyfw-circular-makers',
  '/insights-3': '/insight-aijek-craft-makers',
  // "Our Work" sub-pages were "URL coming soon" stubs
  '/our-work-1': '/our-work',
  '/our-work-2': '/our-work',
  '/our-work-3': '/our-work',
  '/our-work-4': '/our-work',
  '/our-work-5': '/our-work',
  // placeholder rooms with no content yet
  '/services': '/our-work',
  '/careers': '/volunteer',
  '/datalabs': '/industries',
  '/discussion': '/#community',
  '/shop': '/',
  '/archives': '/press',
};

// How complete a member's presence is, and the single next step (the dashboard shows this first, 12 Oct).
// Each part is a step in a fixed order; the first missing one is the next step.
export interface Step { key: string; label: string; href: string; done: boolean; /** comes before every other missing step */ urgent?: boolean }

export function profileSteps(p: {
  photoKey: string | null; headline: string | null; bio: string | null; city: string | null; country: string | null; roleTitle: string | null;
  linkedin: string | null; website: string | null; published: boolean; tags: { industry: string[]; skill: string[] };
} | null, opts: { linkedinLinked: boolean; linkedinOffered: boolean }): Step[] {
  const href = '/dashboard/profile';
  if (!p) return [{ key: 'start', label: 'Start your profile', href, done: false }];
  return [
    { key: 'photo', label: 'Add a photo', href, done: !!p.photoKey },
    { key: 'headline', label: 'Write a headline', href, done: !!p.headline },
    { key: 'role', label: 'Add your current role', href, done: !!p.roleTitle },
    { key: 'place', label: 'Add your city and country', href, done: !!p.city && !!p.country },
    { key: 'bio', label: 'Write a short bio', href, done: !!p.bio },
    { key: 'industries', label: 'Choose your industries', href, done: p.tags.industry.length > 0 },
    { key: 'skills', label: 'List your skills', href, done: p.tags.skill.length > 0 },
    { key: 'links', label: 'Add your LinkedIn or website', href, done: !!p.linkedin || !!p.website },
    ...(opts.linkedinOffered || opts.linkedinLinked ? [{ key: 'linkedin', label: 'Link LinkedIn for “Identity checked”', href, done: opts.linkedinLinked }] : []),
    { key: 'publish', label: 'Publish your profile', href, done: p.published },
  ];
}

export function companySteps(c: {
  logoKey: string | null; description: string | null; city: string | null; country: string | null; size: string | null; published: boolean; tags: { industry: string[] };
}, extra: { liveListings: number; certifications: number; identity: 'checked' | 'pending' | 'recheck' | 'none' }, orgQuery: string): Step[] {
  const page = `/dashboard/company${orgQuery}`;
  return [
    { key: 'logo', label: 'Add your company logo', href: page, done: !!c.logoKey },
    { key: 'description', label: 'Describe your company', href: page, done: !!c.description },
    { key: 'hq', label: 'Add your head office', href: page, done: !!c.city && !!c.country },
    // a public page with no size (the old 201-1000 range was cleared in migration 0006): the owner is asked first
    { key: 'size', label: 'Choose your company size', href: page, done: !!c.size, urgent: c.published },
    { key: 'industries', label: 'Choose your industries', href: page, done: c.tags.industry.length > 0 },
    { key: 'listing', label: 'Publish a listing', href: `/dashboard/listings${orgQuery}`, done: extra.liveListings > 0 },
    { key: 'certifications', label: 'Add your certifications', href: page, done: extra.certifications > 0 },
    { key: 'publish', label: 'Publish your company page', href: page, done: c.published },
    // a pending request is the company's part done: the rest is ours
    { key: 'identity', label: extra.identity === 'recheck' ? 'Renew “Identity checked”' : 'Ask for “Identity checked”', href: `/dashboard/identity${orgQuery}`, done: extra.identity === 'checked' || extra.identity === 'pending' },
  ];
}

export function completeness(steps: Step[]) {
  const done = steps.filter((s) => s.done).length;
  return { percent: steps.length ? Math.round((done / steps.length) * 100) : 0, next: steps.find((s) => s.urgent && !s.done) ?? steps.find((s) => !s.done) ?? null, done, total: steps.length };
}

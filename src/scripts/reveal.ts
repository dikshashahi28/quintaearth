import { prefersReducedMotion } from './motion';

/**
 * Fade-and-rise for every `.rv` element as it scrolls into view, staggered among siblings.
 * Content stays visible without JS: the hiding class `.anim` is only added here.
 *
 * Phones: one screen holds a whole section, so the desktop timing (start at the fold, stagger up to .63s,
 * .8s fade) left most of a freshly scrolled screen blank for over a second. On phones the reveal starts
 * about a third of a screen before an item reaches the fold (a fling
 * moves a whole screen at once), the stagger is capped lower, base.css drops the fade (only a short rise
 * remains, so content is never blank), and
 * items already on screen when the script runs are shown at once, so a slow script never blanks what
 * the reader is already looking at.
 */
export function initReveal(): void {
  const root = document.documentElement;
  if (root.classList.contains('anim') || prefersReducedMotion() || !('IntersectionObserver' in window)) return;
  const items = [...document.querySelectorAll<HTMLElement>('.rv')];
  if (!items.length) return;

  const phone = window.matchMedia('(max-width: 640px)').matches;
  const maxStep = phone ? 3 : 7;
  const step = phone ? 0.06 : 0.09;

  // read every position before writing, then mark the visible ones in the same frame as .anim,
  // so they never take the hidden style and never transition
  const onScreen = new Set<HTMLElement>();
  if (phone) {
    const vh = window.innerHeight;
    for (const el of items) {
      const r = el.getBoundingClientRect();
      if (r.width > 0 && r.bottom > 0 && r.top < vh) onScreen.add(el);
    }
    for (const el of onScreen) el.classList.add('in');
  }
  root.classList.add('anim');

  const seen = new Map<Node, number>();
  for (const el of items) {
    if (onScreen.has(el)) continue;
    const parent = el.parentNode;
    if (!parent) continue;
    const n = seen.get(parent) ?? 0;
    seen.set(parent, n + 1);
    if (n) el.style.transitionDelay = `${Math.min(n, maxStep) * step}s`;
  }

  const io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (!e.isIntersecting) continue;
        e.target.classList.add('in');
        io.unobserve(e.target);
      }
    },
    { rootMargin: phone ? '0px 0px 35% 0px' : '0px 0px -8% 0px' },
  );
  for (const el of items) if (!onScreen.has(el)) io.observe(el);
}

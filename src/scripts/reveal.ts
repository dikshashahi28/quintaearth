import { prefersReducedMotion } from './motion';

/**
 * Fade-and-rise for every `.rv` element as it scrolls into view, staggered among siblings.
 * Content stays visible without JS: the hiding class `.anim` is only added here.
 */
export function initReveal(): void {
  const root = document.documentElement;
  if (root.classList.contains('anim') || prefersReducedMotion() || !('IntersectionObserver' in window)) return;
  const items = [...document.querySelectorAll<HTMLElement>('.rv')];
  if (!items.length) return;
  root.classList.add('anim');

  const seen = new Map<Node, number>();
  for (const el of items) {
    const parent = el.parentNode;
    if (!parent) continue;
    const n = seen.get(parent) ?? 0;
    seen.set(parent, n + 1);
    if (n) el.style.transitionDelay = `${Math.min(n, 7) * 0.09}s`;
  }

  const io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (!e.isIntersecting) continue;
        e.target.classList.add('in');
        io.unobserve(e.target);
      }
    },
    { rootMargin: '0px 0px -8% 0px' },
  );
  for (const el of items) io.observe(el);
}

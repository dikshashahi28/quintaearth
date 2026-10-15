import { prefersReducedMotion } from './motion';

/**
 * The headline word turns through who the hub is for (Paras, 8 Oct). It makes one pass and comes to rest on
 * the first word, and it waits while the pointer or keyboard focus is in the hero (WCAG 2.2.2). Its slot is
 * fixed at the widest word so the headline never reflows. The valley's loops pause while the hero is off screen.
 */
export function initRotatingWord(): void {
  const rot = document.getElementById('rot');
  const scene = document.getElementById('scene');
  const hero = rot?.closest('section');
  if (!rot || !hero) return;

  if ('IntersectionObserver' in window && scene) {
    new IntersectionObserver(([e]) => scene.classList.toggle('idle', !e?.isIntersecting)).observe(hero);
  }
  if (prefersReducedMotion()) return;

  const words: string[] = JSON.parse(rot.dataset.words ?? '[]');
  if (words.length < 2) return;

  // the slot is set once per layout, never tweened: a width transition would re-lay out the headline each turn
  const measure = () => {
    const probe = document.createElement('span');
    probe.className = 'rot';
    probe.style.cssText = 'position:absolute;visibility:hidden;white-space:nowrap;width:auto';
    rot.parentNode?.appendChild(probe);
    const widest = Math.max(...words.map((w) => { probe.textContent = w; return probe.offsetWidth; }));
    probe.remove();
    rot.style.width = `${widest}px`;
  };
  measure();
  document.fonts?.ready.then(measure);
  let measureTimer: number | undefined;
  const remeasure = () => { window.clearTimeout(measureTimer); measureTimer = window.setTimeout(measure, 120); };
  new ResizeObserver(remeasure).observe(hero);

  let i = 0;
  let turns = 0;
  let paused = false;
  let timer: number | undefined;

  const schedule = () => {
    window.clearTimeout(timer);
    if (paused || turns >= words.length) return;
    timer = window.setTimeout(turn, 2800);
  };
  const turn = () => {
    // a hidden tab waits its turn again rather than skipping a word
    if (document.hidden) { schedule(); return; }
    rot.classList.remove('show');
    rot.classList.add('out');
    window.setTimeout(() => {
      i = (i + 1) % words.length;
      turns++;
      rot.textContent = words[i]!;
      rot.classList.remove('out');
      void rot.offsetWidth; // restart the entry animation
      rot.classList.add('show');
      schedule();
    }, 330);
  };
  const pause = () => { paused = true; window.clearTimeout(timer); };
  const resume = () => { paused = false; schedule(); };

  hero.addEventListener('pointerenter', (e) => { if (e.pointerType === 'mouse') pause(); });
  hero.addEventListener('pointerleave', (e) => { if (e.pointerType === 'mouse') resume(); });
  hero.addEventListener('focusin', pause);
  hero.addEventListener('focusout', (e) => { if (!hero.contains(e.relatedTarget as Node | null)) resume(); });
  if (hero.matches(':hover') || hero.contains(document.activeElement)) paused = true;
  schedule();
}

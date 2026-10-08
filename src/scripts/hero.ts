import { prefersReducedMotion } from './motion';

/**
 * The headline word keeps turning (Paras, 8 Oct). Its slot is fixed at the widest word so the
 * headline never reflows. The valley's loops pause while the hero is off screen.
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
  window.addEventListener('resize', measure);
  document.fonts?.ready.then(measure);

  let i = 0;
  window.setInterval(() => {
    if (document.hidden) return;
    rot.classList.remove('show');
    rot.classList.add('out');
    window.setTimeout(() => {
      i = (i + 1) % words.length;
      rot.textContent = words[i]!;
      rot.classList.remove('out');
      void rot.offsetWidth; // restart the entry animation
      rot.classList.add('show');
    }, 330);
  }, 2800);
}

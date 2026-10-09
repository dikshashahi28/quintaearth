import { prefersReducedMotion } from './motion';

/** One industry as the home-page carousel shows it. Built at build time, read back from JSON here. */
export interface StageIndustry {
  name: string;
  icon: string;
  motion: string;
  href: string;
  image: string;
  imageAlt: string;
  /** stories + insights + press filed under this industry */
  filed: number;
  subs: { name: string; href: string; count: number }[];
  /** a handful of pieces to show under the chips */
  items: { kind: string; title: string; href: string; sub: string }[];
}

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

function countUp(el: HTMLElement, to: number, reduce: boolean) {
  if (reduce || to < 10) { el.textContent = String(to); return; }
  let t0: number | null = null;
  const step = (ts: number) => {
    t0 ??= ts;
    const p = 1 - Math.pow(1 - Math.min(1, (ts - t0) / 900), 3);
    el.textContent = String(Math.round(to * p));
    if (p < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}

/** Preload, retry once, then cross-fade, so the alt text never paints inside the frame. */
function swapImage(img: HTMLImageElement, src: string, alt: string) {
  let tries = 0;
  const pre = new Image();
  img.classList.add('fade');
  const show = () => { img.src = src; img.alt = alt; img.classList.remove('fade'); };
  pre.onload = show;
  pre.onerror = () => { if (tries++ < 1) pre.src = `${src}?r=${Date.now()}`; else show(); };
  pre.src = src;
}

/** Home "Industries" carousel: pebbles, arrows, arrow keys and swipe move between the eight industries. */
export function initStage(): void {
  const data = document.getElementById('stageData');
  const slide = document.getElementById('slide');
  const pebbles = document.getElementById('pebbles');
  const stage = document.getElementById('stage');
  if (!data || !slide || !pebbles || !stage) return;
  const slides: StageIndustry[] = JSON.parse(data.textContent ?? '[]');
  if (!slides.length) return;
  const reduce = prefersReducedMotion();
  const $ = <T extends Element = HTMLElement>(id: string) => document.getElementById(id) as unknown as T;

  // warm the cache so switching never shows an empty frame
  slides.forEach((s) => { new Image().src = s.image; });

  let cur = 0;
  let busy = false;

  const paint = () => {
    const o = slides[cur]!;
    // the chips and the list are re-rendered below; if focus was in them, hand it to the current pebble
    const hadFocus = slide.contains(document.activeElement);
    swapImage($<HTMLImageElement>('sImg'), o.image, o.imageAlt);
    $<SVGUseElement>('sIco').setAttribute('href', `#hi-${o.icon}`);
    $<SVGUseElement>('sBadgeIco').setAttribute('href', `#hi-${o.icon}`);
    $('sBadgeTxt').textContent = `${o.subs.length} sub-categories`;
    $('sCount').innerHTML = `<b>${cur + 1}</b> / ${slides.length}`;
    $('progI').style.transform = `scaleX(${(cur + 1) / slides.length})`;
    $('sName').textContent = o.name;
    countUp($('sSubs'), o.subs.length, reduce);
    countUp($('sStories'), o.filed, reduce);
    $('sChips').innerHTML = o.subs.map((c, i) =>
      `<li style="animation-delay:${i * 45}ms"><a class="chip${c.count ? ' has' : ''}" href="${esc(c.href)}">${esc(c.name)}${c.count ? ` <i>${c.count}</i>` : ''}</a></li>`,
    ).join('');
    $('sWork').innerHTML = `<h3>Filed here</h3><ul class="filed">${o.items.map((it) =>
      `<li><span>${esc(it.kind)}</span><a href="${esc(it.href)}">${esc(it.title)}</a><em>${esc(it.sub)}</em></li>`,
    ).join('')}</ul><a class="allof" href="${esc(o.href)}">All of ${esc(o.name)}<svg class="ic" aria-hidden="true"><use href="#i-arrow-right"/></svg></a>`;
    $('sStatus').textContent = `${o.name}, ${cur + 1} of ${slides.length}`;
    pebbles.querySelectorAll<HTMLButtonElement>('.pebble').forEach((b, i) => {
      b.setAttribute('aria-current', String(i === cur));
      // on phones the pebbles scroll sideways: keep the current one centred
      if (i === cur && pebbles.scrollWidth > pebbles.clientWidth + 4) {
        const r = b.getBoundingClientRect(), pr = pebbles.getBoundingClientRect();
        pebbles.scrollTo({ left: pebbles.scrollLeft + (r.left + r.width / 2) - (pr.left + pr.width / 2), behavior: reduce ? 'auto' : 'smooth' });
      }
      if (i === cur && hadFocus) b.focus({ preventScroll: true });
    });
  };

  const go = (target: number, dir?: number) => {
    const i = (target + slides.length) % slides.length;
    if (i === cur || busy) return;
    const d = dir ?? (i > cur ? 1 : -1);
    cur = i;
    if (reduce) { paint(); return; }
    busy = true;
    slide.classList.remove('in-l', 'in-r');
    slide.classList.add(d > 0 ? 'out-l' : 'out-r');
    window.setTimeout(() => {
      paint();
      slide.classList.remove('out-l', 'out-r');
      void slide.offsetWidth;
      slide.classList.add(d > 0 ? 'in-l' : 'in-r');
      busy = false;
    }, 180);
  };

  pebbles.addEventListener('click', (e) => {
    const b = (e.target as Element).closest<HTMLButtonElement>('.pebble');
    if (b?.dataset.i) go(Number(b.dataset.i));
  });
  $('prev').addEventListener('click', () => go(cur - 1, -1));
  $('next').addEventListener('click', () => go(cur + 1, 1));
  stage.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') { e.preventDefault(); go(cur - 1, -1); }
    if (e.key === 'ArrowRight') { e.preventDefault(); go(cur + 1, 1); }
  });

  // swipe on touch screens
  let sx: number | null = null, sy = 0;
  slide.addEventListener('pointerdown', (e) => { if (e.pointerType !== 'mouse') { sx = e.clientX; sy = e.clientY; } });
  slide.addEventListener('pointerup', (e) => {
    if (sx === null) return;
    const dx = e.clientX - sx, dy = e.clientY - sy;
    sx = null;
    if (Math.abs(dx) > 48 && Math.abs(dx) > Math.abs(dy) * 1.4) go(cur + (dx < 0 ? 1 : -1), dx < 0 ? 1 : -1);
  });
  slide.addEventListener('pointercancel', () => { sx = null; });
}

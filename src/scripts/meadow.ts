import { prefersReducedMotion } from './motion';

const NS = 'http://www.w3.org/2000/svg';

type Attrs = Record<string, string | number>;
function el<K extends keyof SVGElementTagNameMap>(tag: K, attrs: Attrs = {}): SVGElementTagNameMap[K] {
  const node = document.createElementNS(NS, tag);
  for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, String(v));
  return node;
}
const f1 = (n: number) => n.toFixed(1);

/** Seeded so the meadow looks the same on every load and every page. */
function seeded(seed: number) {
  let s = seed;
  return () => { s = (s * 9301 + 49297) % 233280; return s / 233280; };
}

/** A filled, tapered blade of grass rooted at 0,0. */
function blade(h: number, lean: number, w: number, fill: string) {
  const d = `M${f1(-w)} 0 C ${f1(-w * .7)} ${f1(-h * .38)}, ${f1(lean * .55 - w * .35)} ${f1(-h * .74)}, ${f1(lean)} ${f1(-h)} `
    + `C ${f1(lean * .55 + w * .35)} ${f1(-h * .74)}, ${f1(w * .7)} ${f1(-h * .38)}, ${f1(w)} 0 Z`;
  return el('path', { d, fill });
}

interface Bendable { x: number; el: SVGGElement }
interface Butterfly { el: SVGGElement; x: number; y: number; hx: number; ph: number; off: number }

/**
 * Footer meadow: three depth layers of grass, flowers and dandelion clocks. Grass bends away from the
 * pointer, two butterflies drift (and follow the pointer when it is near), a click blows the nearest clock.
 */
export function initMeadow(): void {
  const svg = document.getElementById('meadow') as SVGSVGElement | null;
  const grass = document.getElementById('mdGrass');
  const flowers = document.getElementById('mdFlowers');
  const seeds = document.getElementById('mdSeeds');
  if (!svg || !grass || !flowers || !seeds || svg.dataset.ready) return;
  svg.dataset.ready = '1';
  const reduce = prefersReducedMotion();
  const rnd = seeded(7);
  const bendables: Bendable[] = [];

  // pale and short at the back, dark and tall in front
  const layers = [
    { n: 150, cols: ['#cfe0cc', '#e7f0e3', '#d3e0d0'], h: [10, 26], y: 111 },
    { n: 120, cols: ['#7fa26b', '#a9c7a4', '#8fb58a'], h: [18, 44], y: 112 },
    { n: 70, cols: ['#4d6e3d', '#2f6b3a', '#5a8450'], h: [26, 60], y: 114 },
  ];
  const pick = (cols: string[]) => cols[Math.floor(rnd() * cols.length)]!;
  let ladybirdHost: { x: number; sway: SVGGElement; h: number; lean: number } | null = null;

  layers.forEach((L, li) => {
    const [hMin, hMax] = L.h as [number, number];
    for (let i = 0; i < L.n; i++) {
      const x = 4 + rnd() * 1432;
      const g = el('g', { class: 'bl', transform: `translate(${f1(x)} ${f1(L.y + rnd() * 4)})` });
      if (li === 0) {
        const count = 4 + Math.floor(rnd() * 5);
        for (let q = 0; q < count; q++) {
          const h = hMin + rnd() * (hMax - hMin);
          g.appendChild(blade(h, (rnd() - .5) * h * .9, .9 + rnd() * 1.1, pick(L.cols)));
        }
        grass.appendChild(g);
        continue;
      }
      const bend = el('g', { class: 'bend' });
      const sway = el('g', { class: 'sway' });
      sway.style.animationDelay = `${(-rnd() * 6).toFixed(2)}s`;
      sway.style.animationDuration = `${(4.5 + rnd() * 3).toFixed(2)}s`;
      let tallest = { h: 0, lean: 0 };
      const count = 4 + Math.floor(rnd() * 6);
      for (let k = 0; k < count; k++) {
        const h = hMin + rnd() * (hMax - hMin);
        const lean = (rnd() - .5) * h * .9;
        sway.appendChild(blade(h, lean, .9 + rnd() * (li === 2 ? 1.6 : 1.1), pick(L.cols)));
        if (h > tallest.h) tallest = { h, lean };
      }
      if (rnd() < .12) {
        // a seed head on a thin stalk
        const rh = hMax + 6, rl = (rnd() - .5) * 10;
        sway.appendChild(el('path', { d: `M0 0 C ${f1(rl * .4)} ${f1(-rh * .4)}, ${f1(rl * .8)} ${f1(-rh * .7)}, ${f1(rl)} ${f1(-rh)}`, fill: 'none', stroke: L.cols[1]!, 'stroke-width': 1.4, 'stroke-linecap': 'round' }));
        sway.appendChild(el('path', { d: `M${f1(rl)} ${f1(-rh)} c -2.6 3, -2.1 7.5, -1 10 c 1.6 -2.5, 2.1 -7, 1 -10 Z`, fill: '#b8912f', opacity: .85 }));
      }
      bend.appendChild(sway);
      g.appendChild(bend);
      grass.appendChild(g);
      bendables.push({ x, el: bend });
      if (li === 2 && Math.abs(x - 700) < 60 && (!ladybirdHost || Math.abs(x - 700) < Math.abs(ladybirdHost.x - 700))) {
        ladybirdHost = { x, sway, ...tallest };
      }
    }
  });

  // a ladybird rides the tallest blade of a front tuft near the middle
  const host = ladybirdHost as { x: number; sway: SVGGElement; h: number; lean: number } | null;
  if (host) {
    const lb = el('g', { transform: `translate(${f1(host.lean * .7)} ${f1(-host.h * .8)})` });
    lb.append(
      el('circle', { r: 3.4, fill: '#c43d2d' }),
      el('circle', { cx: -2.6, cy: 0, r: 1.5, fill: '#1d1d1d' }),
      el('circle', { cx: 1, cy: -1.4, r: .8, fill: '#1d1d1d' }),
      el('circle', { cx: 1.4, cy: 1.4, r: .8, fill: '#1d1d1d' }),
    );
    host.sway.appendChild(lb);
  }

  // dandelion clocks
  const clocks: { x: number; y: number }[] = [];
  [440, 760, 1120].forEach((x, i) => {
    const h = 40 + i * 6;
    const g = el('g', { class: 'fl', transform: `translate(${x} 112)` });
    const bend = el('g', { class: 'bend' });
    const sway = el('g', { class: 'sway' });
    sway.style.animationDelay = `${-1.3 - i * 1.1}s`;
    sway.appendChild(el('path', { d: `M0 0 C 1 -12, -1 -24, 0 -${h}`, fill: 'none', stroke: '#4d6e3d', 'stroke-width': 1.4, 'stroke-linecap': 'round' }));
    const head = el('g', { class: 'petal', transform: `translate(0 -${h})` });
    for (let k = 0; k < 12; k++) {
      const a = (k / 12) * Math.PI * 2, cx = Math.cos(a) * 6, cy = Math.sin(a) * 6;
      head.append(
        el('path', { d: `M0 0 L${cx.toFixed(2)} ${cy.toFixed(2)}`, stroke: '#4d6e3d', 'stroke-width': .8, 'stroke-linecap': 'round' }),
        el('circle', { cx: cx.toFixed(2), cy: cy.toFixed(2), r: 1.1, fill: '#fff', stroke: '#4d6e3d', 'stroke-width': .5 }),
      );
    }
    head.appendChild(el('circle', { r: 1.6, fill: '#8a6a1c' }));
    sway.appendChild(head); bend.appendChild(sway); g.appendChild(bend); flowers.appendChild(g);
    bendables.push({ x, el: bend });
    clocks.push({ x, y: 112 - h });
  });

  // small flowers, white and gold
  const flowerPts: { x: number; y: number }[] = [];
  [120, 330, 560, 640, 860, 1010, 1180, 1340].forEach((x, i) => {
    const h = 28 + (i % 3) * 8;
    const white = i % 2 === 0;
    const g = el('g', { class: 'fl', transform: `translate(${x} 110)` });
    const bend = el('g', { class: 'bend' });
    const sway = el('g', { class: 'sway' });
    sway.style.animationDelay = `${-i * .9}s`;
    sway.appendChild(el('path', { d: `M0 0 C 1 -10, -1 -20, 0 -${h}`, fill: 'none', stroke: '#7fa26b', 'stroke-width': 1.6, 'stroke-linecap': 'round' }));
    const head = el('g', { class: 'petal', transform: `translate(0 -${h})` });
    for (let k = 0; k < 5; k++) {
      const a = (k / 5) * Math.PI * 2;
      head.appendChild(el('circle', { cx: (Math.cos(a) * 3.6).toFixed(2), cy: (Math.sin(a) * 3.6).toFixed(2), r: 2.2, fill: white ? '#fff' : '#d9b85a' }));
    }
    head.appendChild(el('circle', { r: 1.8, fill: white ? '#d9b85a' : '#b8912f' }));
    sway.appendChild(head); bend.appendChild(sway); g.appendChild(bend); flowers.appendChild(g);
    bendables.push({ x, el: bend });
    flowerPts.push({ x, y: 110 - h });
  });

  const pt = svg.createSVGPoint();
  const toSvg = (e: PointerEvent | MouseEvent) => {
    pt.x = e.clientX; pt.y = e.clientY;
    const m = svg.getScreenCTM();
    return m ? pt.matrixTransform(m.inverse()) : null;
  };
  const bendAll = (px: number | null) => {
    for (const b of bendables) {
      let t = '';
      if (px !== null) {
        const dx = b.x - px, r = 150;
        if (Math.abs(dx) < r) { const k = 1 - Math.abs(dx) / r; t = `rotate(${f1((dx < 0 ? -1 : 1) * k * k * 26)}deg)`; }
      }
      if (b.el.style.transform !== t) b.el.style.transform = t;
    }
  };

  let ptr: DOMPoint | null = null;
  svg.addEventListener('pointermove', (e) => {
    if (e.pointerType === 'touch') return;
    const p = toSvg(e);
    if (!p) return;
    ptr = p;
    bendAll(p.x);
  });
  svg.addEventListener('pointerleave', () => { ptr = null; bendAll(null); });

  // a click (never a pan) blows the nearest clock; skipped under reduced motion, where seeds would never clear
  svg.addEventListener('click', (e) => {
    if (reduce) return;
    const p = toSvg(e);
    if (!p) return;
    const c = clocks.reduce((a, b) => (Math.abs(b.x - p.x) < Math.abs(a.x - p.x) ? b : a));
    for (let i = 0; i < 10; i++) {
      const s = el('g', { class: 'seed', transform: `translate(${f1(c.x)} ${f1(c.y)})` });
      s.style.setProperty('--dx', `${((Math.random() - .5) * 140).toFixed(0)}px`);
      s.style.setProperty('--dy', `${(-(50 + Math.random() * 60)).toFixed(0)}px`);
      s.style.setProperty('--r', `${((Math.random() - .5) * 160).toFixed(0)}deg`);
      s.style.animationDelay = `${(Math.random() * .4).toFixed(2)}s`;
      s.append(
        el('path', { d: 'M0 0 L0 -9 M-4 -12 L0 -9 L4 -12 M-4 -6 L0 -9 L4 -6 M-5 -9 L0 -9 L5 -9', fill: 'none', stroke: '#4d6e3d', 'stroke-width': 1.2, 'stroke-linecap': 'round' }),
        el('circle', { r: 2, fill: '#d9b85a', stroke: '#8a6a1c', 'stroke-width': .6 }),
      );
      s.addEventListener('animationend', () => s.remove());
      seeds.appendChild(s);
    }
  });

  const bf1 = document.getElementById('bf1') as SVGGElement | null;
  const bf2 = document.getElementById('bf2') as SVGGElement | null;
  if (!bf1 || !bf2) return;
  const flies: Butterfly[] = [
    { el: bf1, x: 560, y: 48, hx: 560, ph: 0, off: -34 },
    { el: bf2, x: 880, y: 40, hx: 880, ph: 2.1, off: 34 },
  ];
  if (reduce) {
    svg.pauseAnimations();
    flies.forEach((b, i) => {
      const f = flowerPts[i ? 4 : 2]!;
      b.el.setAttribute('transform', `translate(${f.x} ${f.y - 6})`);
      b.el.classList.add('still');
    });
    return;
  }

  let running = false, last = 0, t = 0;
  const frame = (now: number) => {
    if (!running) return;
    const dt = Math.min(.05, (now - last) / 1000 || .016);
    last = now; t += dt;
    for (const b of flies) {
      let tx: number, ty: number;
      if (ptr) { tx = ptr.x + b.off; ty = Math.max(34, Math.min(96, ptr.y - 18)); }
      else { b.hx += Math.sin(t * .13 + b.ph) * .25; tx = b.hx + Math.sin(t * .5 + b.ph) * 120; ty = 54 + Math.sin(t * .9 + b.ph) * 16; }
      const vx = (tx - b.x) * .035 + Math.sin(t * 2.3 + b.ph) * .9;
      const vy = (ty - b.y) * .035 + Math.cos(t * 3.1 + b.ph) * .6;
      b.x = Math.max(16, Math.min(1424, b.x + vx));
      b.y = Math.max(30, Math.min(98, b.y + vy));
      b.el.setAttribute('transform', `translate(${f1(b.x)} ${f1(b.y)}) rotate(${f1(vx * 6)})`);
    }
    requestAnimationFrame(frame);
  };
  // only animate while the meadow is on screen
  new IntersectionObserver((entries) => {
    const on = entries[0]?.isIntersecting ?? false;
    if (on && !running) { running = true; last = 0; requestAnimationFrame(frame); }
    else if (!on) running = false;
    svg.classList.toggle('idle', !on);
    if (on) svg.unpauseAnimations(); else svg.pauseAnimations();
  }, { threshold: .05 }).observe(svg);
}

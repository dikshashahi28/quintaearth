import { prefersReducedMotion } from './motion';

/**
 * The home-page river. One path runs from the gold spring in the hero down every section: a straight
 * rail beside the content, a meander through the "who" stones and the five parts, and a pool at the
 * community section. It draws itself to just below the viewport as you scroll, lighting a gold bead at
 * each section it reaches.
 *
 * Each section says how the river treats it with data-river: start | stones | parts | wide | col | pool.
 */
type Pt = [number, number];
interface Dot { el: SVGCircleElement; halo: SVGCircleElement; y: number }
interface Branch { paths: SVGPathElement[]; flow: SVGPathElement | null; items: Element[]; y: number }

const NS = 'http://www.w3.org/2000/svg';
const f = (n: number) => n.toFixed(1);
const mk = <K extends keyof SVGElementTagNameMap>(tag: K, cls?: string) => {
  const el = document.createElementNS(NS, tag);
  if (cls) el.setAttribute('class', cls);
  return el;
};
/** vertical-ish S-bend from a to c */
const vSeg = (a: Pt, c: Pt) => {
  if (Math.abs(a[0] - c[0]) < .5) return ` L${f(c[0])} ${f(c[1])}`;
  const m = (c[1] - a[1]) / 2;
  return ` C${f(a[0])} ${f(a[1] + m)} ${f(c[0])} ${f(c[1] - m)} ${f(c[0])} ${f(c[1])}`;
};
/** horizontal-ish S-bend from a to c */
const hSeg = (a: Pt, c: Pt) => {
  const m = (c[0] - a[0]) / 2;
  return ` C${f(a[0] + m)} ${f(a[1])} ${f(a[0] + m)} ${f(c[1])} ${f(c[0])} ${f(c[1])}`;
};

export function initRiver(): void {
  const main = document.getElementById('main');
  const svg = document.querySelector<SVGSVGElement>('.river');
  const get = <T extends Element>(id: string) => document.getElementById(id) as unknown as T | null;
  const path = get<SVGPathElement>('riverPath'), water = get<SVGPathElement>('riverWater');
  const flow = get<SVGPathElement>('riverFlow'), maskP = get<SVGPathElement>('riverMaskPath');
  const maskEl = get<SVGMaskElement>('riverMask'), grad = get<SVGLinearGradientElement>('riverGrad');
  const dotsG = get<SVGGElement>('riverDots'), crossG = get<SVGGElement>('riverCross');
  const pond = document.getElementById('pond');
  if (!main || !svg || !path || !water || !flow || !maskP || !maskEl || !grad || !dotsG || !crossG) return;
  const reduce = prefersReducedMotion();

  let L = 0;
  let table: [number, number][] = [];
  let dots: Dot[] = [];
  let branches: Branch[] = [];
  let poolY: number | null = null;

  const rel = (el: Element) => {
    const r = el.getBoundingClientRect(), m = main.getBoundingClientRect();
    return { top: r.top - m.top, bottom: r.bottom - m.top, cx: (r.left + r.right) / 2 - m.left, cy: (r.top + r.bottom) / 2 - m.top };
  };
  /** where the rail runs for each layout: beside the column or the wide container, or the left edge on small screens */
  const railX = (mode: string, W: number) => {
    if (W < 1180) return W <= 640 ? 12 : 18;
    const col = Math.min(760, W - 32), wide = Math.min(1080, W - 200);
    if (mode === 'col') return (W - col) / 2 - 64;
    return (W - wide) / 2 - 44;
  };

  function build() {
    const W = main!.clientWidth, H = main!.scrollHeight;
    const pts: Pt[] = [], ds: Pt[] = [];
    svg!.setAttribute('viewBox', `0 0 ${W} ${H}`);
    grad!.setAttribute('y2', String(H));
    maskEl!.setAttribute('width', String(W));
    maskEl!.setAttribute('height', String(H));
    crossG!.replaceChildren();
    branches = [];
    poolY = null;
    let deepTop: number | null = null, deepBottom: number | null = null;

    main!.querySelectorAll<HTMLElement>(':scope > section[data-river]').forEach((s) => {
      const mode = s.dataset.river!;
      const inner = s.querySelector('.in');
      if (!inner) return;
      const b = rel(inner);
      if (s.hasAttribute('data-deep')) { const sb = rel(s); deepTop = sb.top; deepBottom = sb.bottom; }

      if (mode === 'start') {
        const bead = s.querySelector('[data-start]');
        if (bead) { const r = rel(bead); pts.push([r.cx, r.cy]); }
        return;
      }
      const x = railX(mode, W);

      if (mode === 'stones' || mode === 'parts') {
        // measure stops without the reveal offset
        inner.classList.add('measure');
        const stops = [...s.querySelectorAll('[data-stop]')].map((el) => ({ li: el.parentElement!, ...rel(el) }));
        inner.classList.remove('measure');
        if (!stops.length) { pts.push([x, b.top - 10], [x, b.bottom + 10]); return; }
        if (W <= 900) {
          // stacked layout: the rail passes each stop on the left
          pts.push([x, b.top - 10]);
          stops.sort((a, c) => a.cy - c.cy).forEach((o, i) => {
            ds.push([x, o.cy]);
            branches.push({ paths: [], flow: null, items: [o.li], y: o.cy });
            o.li.style.transitionDelay = `${i * .12}s`;
          });
          pts.push([x, b.bottom + 10]);
          return;
        }
        // grid layout: a side stream meanders through the stops row by row, alternating direction
        const rows: { cy: number; items: typeof stops }[] = [];
        stops.slice().sort((a, c) => a.cy - c.cy).forEach((o) => {
          const row = rows.find((r) => Math.abs(r.cy - o.cy) < 90);
          if (row) row.items.push(o); else rows.push({ cy: o.cy, items: [o] });
        });
        rows.forEach((r) => r.items.sort((a, c) => a.cx - c.cx));
        const order = rows.flatMap((r, i) => (i % 2 ? r.items.slice().reverse() : r.items));
        const jy = rows[0]!.cy;
        let d = `M${f(x)} ${f(jy)}`, prev: Pt = [x, jy];
        order.forEach((o, i) => {
          d += Math.abs(o.cy - prev[1]) < 90 ? hSeg(prev, [o.cx, o.cy]) : vSeg(prev, [o.cx, o.cy]);
          prev = [o.cx, o.cy];
          o.li.style.transitionDelay = `${(i + 1) * .2}s`;
        });
        const pw = mk('path', 'cross water'), p = mk('path', 'cross'), pf = mk('path', 'cross flow');
        [pw, p, pf].forEach((q) => { q.setAttribute('d', d); crossG!.appendChild(q); });
        const len = p.getTotalLength();
        [pw, p].forEach((q) => { q.style.strokeDasharray = `${len} ${len}`; q.style.strokeDashoffset = String(len); });
        branches.push({ paths: [pw, p], flow: pf, items: order.map((o) => o.li), y: jy });
        pts.push([x, b.top - 10], [x, jy], [x, b.bottom + 10]);
        ds.push([x, jy]);
        return;
      }

      if (mode === 'pool') {
        const pool = s.querySelector('[data-pool]');
        if (pool) { const r = rel(pool); pts.push([r.cx, r.top]); ds.push([r.cx, r.top]); poolY = r.top; }
        return;
      }

      // wide / col: a bead level with the section's marked line
      const mark = s.querySelector('[data-dot]') ?? s.querySelector('h2');
      if (!mark) return;
      const mr = rel(mark);
      const dy = mark.classList.contains('quote') ? mr.top + parseFloat(getComputedStyle(mark).fontSize) * .6 : mr.cy;
      pts.push([x, b.top - 10]);
      ds.push([x, dy]);
      pts.push([x, b.bottom + 10]);
    });
    if (!pts.length) return;

    let d = `M${f(pts[0]![0])} ${f(pts[0]![1])}`;
    for (let i = 1; i < pts.length; i++) d += vSeg(pts[i - 1]!, pts[i]!);
    for (const p of [path!, water!, flow!, maskP!]) p.setAttribute('d', d);

    // the rail turns pale where it crosses the deep CSR band
    grad!.replaceChildren();
    const stop = (off: number, col: string) => { const s = mk('stop'); s.setAttribute('offset', String(off)); s.setAttribute('stop-color', col); grad!.appendChild(s); };
    const green = '#2f6b3a', pale = '#cfe0cc';
    if (deepTop !== null && deepBottom !== null && H > 0) {
      stop(0, green); stop(deepTop / H, green); stop(deepTop / H, pale); stop(deepBottom / H, pale); stop(deepBottom / H, green); stop(1, green);
    } else { stop(0, green); stop(1, green); }

    L = path!.getTotalLength();
    table = [];
    const N = Math.max(200, Math.round(L / 12));
    for (let k = 0; k <= N; k++) { const l = (L * k) / N; table.push([path!.getPointAtLength(l).y, l]); }

    dotsG!.replaceChildren();
    dots = ds.map(([cx, cy]) => {
      const r = String(W <= 640 ? 5 : 6);
      const halo = mk('circle', 'halo'), el = mk('circle');
      for (const c of [halo, el]) { c.setAttribute('cx', String(cx)); c.setAttribute('cy', String(cy)); c.setAttribute('r', r); dotsG!.appendChild(c); }
      return { el, halo, y: cy };
    });

    if (reduce) {
      // no drawing: show the whole river, every bead lit
      for (const p of [path!, water!, maskP!]) p.style.strokeDasharray = 'none';
      dots.forEach((o) => o.el.classList.add('on'));
      branches.forEach((br) => {
        br.paths.forEach((p) => { p.style.strokeDashoffset = '0'; });
        br.flow?.classList.add('go');
        br.items.forEach((li) => li.classList.add('lit'));
      });
      pond?.classList.add('lit');
      return;
    }
    for (const p of [path!, water!, maskP!]) p.style.strokeDasharray = `${L} ${L}`;
    update();
  }

  /** path length reached at page height y */
  const lenAt = (y: number) => {
    if (!table.length || y <= table[0]![0]) return 0;
    for (let i = 1; i < table.length; i++) if (table[i]![0] >= y) return table[i - 1]![1];
    return L;
  };

  let ticking = false;
  function update() {
    ticking = false;
    if (reduce || !table.length) return;
    const y = window.innerHeight * .88 - main!.getBoundingClientRect().top;
    const atEnd = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4;
    const off = f(L - (atEnd ? L : lenAt(y)));
    for (const p of [path!, water!, maskP!]) p.style.strokeDashoffset = off;
    for (const o of dots) { const on = o.y <= y || atEnd; o.el.classList.toggle('on', on); o.halo.classList.toggle('on', on); }
    for (const br of branches) {
      const go = br.y <= y || atEnd;
      br.paths.forEach((p) => { p.style.strokeDashoffset = go ? '0' : String(p.getTotalLength()); });
      br.flow?.classList.toggle('go', go);
      br.items.forEach((li) => li.classList.toggle('lit', go));
    }
    if (pond && poolY !== null) pond.classList.toggle('lit', poolY <= y || atEnd);
  }

  window.addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
  // layout moves as fonts and images arrive: rebuild, debounced
  let timer: number | undefined;
  const rebuild = () => { window.clearTimeout(timer); timer = window.setTimeout(build, 60); };
  window.addEventListener('resize', rebuild);
  if ('ResizeObserver' in window) new ResizeObserver(rebuild).observe(main);
  window.addEventListener('load', build);
  document.fonts?.ready.then(build);
  build();
}

/** Sticky header: shadow line once scrolled, phone menu sheet, industries mega menu. */
export function initHeader(): void {
  const hdr = document.querySelector<HTMLElement>('.hdr');
  const menu = document.getElementById('menu');
  const indLink = document.getElementById('indLink');
  const mega = document.getElementById('mega');
  if (!hdr || !menu || !indLink || !mega) return;

  const phone = window.matchMedia('(max-width: 900px)');
  const hover = window.matchMedia('(hover: hover)');

  // the logo's shine is masked by the logo itself; the URL depends on the deploy base, so set it here
  const logoImg = hdr.querySelector<HTMLImageElement>('.logo img');
  if (logoImg) hdr.style.setProperty('--logo-mask', `url("${logoImg.currentSrc || logoImg.src}")`);

  let ticking = false;
  const onScroll = () => {
    ticking = false;
    hdr.classList.toggle('scrolled', window.scrollY > 8);
  };
  window.addEventListener('scroll', () => {
    if (!ticking) { ticking = true; requestAnimationFrame(onScroll); }
  }, { passive: true });
  onScroll();

  const setMega = (open: boolean) => {
    hdr.classList.toggle('mega-open', open);
    indLink.setAttribute('aria-expanded', String(open));
  };
  const setMenu = (open: boolean) => {
    hdr.classList.toggle('open', open);
    menu.setAttribute('aria-expanded', String(open));
    if (!open) setMega(false);
  };

  // phone sheet
  menu.addEventListener('click', () => {
    const open = !hdr.classList.contains('open');
    setMenu(open);
    if (open) document.querySelector<HTMLElement>('#nav a')?.focus();
  });

  // "Industries" opens the menu instead of navigating; the menu itself links to the industries index.
  // With a mouse, hovering has already opened it, so the click that follows must not toggle it shut.
  let hoverOpenedAt = 0;
  indLink.addEventListener('click', (e) => {
    e.preventDefault();
    const justHovered = performance.now() - hoverOpenedAt < 800;
    setMega(justHovered || !hdr.classList.contains('mega-open'));
    hoverOpenedAt = 0;
  });
  let closeTimer: number | undefined;
  indLink.addEventListener('mouseenter', () => {
    if (!hover.matches || phone.matches) return;
    window.clearTimeout(closeTimer);
    if (!hdr.classList.contains('mega-open')) hoverOpenedAt = performance.now();
    setMega(true);
  });
  hdr.addEventListener('mouseleave', () => {
    if (!phone.matches) closeTimer = window.setTimeout(() => setMega(false), 220);
  });
  hdr.addEventListener('mouseenter', () => window.clearTimeout(closeTimer));

  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    if (hdr.classList.contains('mega-open')) { setMega(false); indLink.focus(); }
    else if (hdr.classList.contains('open')) { setMenu(false); menu.focus(); }
  });
  document.addEventListener('click', (e) => {
    if (hdr.contains(e.target as Node)) return;
    setMenu(false);
    setMega(false);
  });
  // keyboard users tabbing past the last link must not leave the menu open over the page (WCAG 2.4.11)
  hdr.addEventListener('focusout', (e) => {
    const next = e.relatedTarget as Node | null;
    // no next target means a click on blank space or a switch of window: the click handler covers those
    if (!next) return;
    if (!hdr.contains(next)) { setMenu(false); setMega(false); return; }
    // moving on to Insights or Community closes the industries panel but keeps the phone sheet open
    if (next !== indLink && !mega.contains(next)) setMega(false);
  });
  // following an in-page link (e.g. Community) closes the sheet
  hdr.querySelectorAll<HTMLAnchorElement>('#nav a:not(#indLink)').forEach((a) => a.addEventListener('click', () => setMenu(false)));
  // leaving the phone layout with the sheet open would strand it
  phone.addEventListener('change', () => setMenu(false));
}

import { prefersReducedMotion } from './motion';

/**
 * The river rail of a public spring page (components/spring/RiverRail.astro). Each section has a bead; when the
 * reader reaches the section, its bead lights gold and the track from the bead before fills River Green down to
 * it, so the river is always drawn between two lit beads, the way it reaches each section on the home page. A
 * bead, once lit, stays lit. Without JavaScript, or under reduced motion, spring-page.css shows the rail fully
 * lit, so nothing depends on this running.
 */
export function initSpringRail(): void {
  const rails = [...document.querySelectorAll<HTMLElement>('.sp-rail[data-arrive] > .qe-rail')];
  if (!rails.length || prefersReducedMotion() || !('IntersectionObserver' in window)) return;
  document.documentElement.classList.add('rail-live');
  const io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (!e.isIntersecting) continue;
        const rail = e.target.previousElementSibling;
        if (rail instanceof HTMLElement && rail.classList.contains('qe-rail')) {
          rail.classList.add('lit');
          // the track above this bead belongs to the stop before: fill it now that both ends are lit
          const i = rails.indexOf(rail);
          if (i > 0) rails[i - 1]!.classList.add('on');
        }
        io.unobserve(e.target);
      }
    },
    // a section counts as reached when its top third is in the upper two thirds of the screen
    { rootMargin: '0px 0px -33% 0px', threshold: 0.2 },
  );
  for (const rail of rails) {
    const section = rail.nextElementSibling;
    if (section) io.observe(section);
  }
}

// Home video band: the poster is a link to YouTube without JS. With JS, a real play button is shown
// over it and the privacy-friendly iframe is only created on click, then focus moves into it.
export function initVideo(): void {
  document.querySelectorAll<HTMLElement>('[data-video-frame]').forEach((frame) => {
    const btn = frame.querySelector<HTMLButtonElement>('.vbtn');
    const link = frame.querySelector<HTMLAnchorElement>('.vposter');
    const src = frame.dataset.embed;
    if (!btn || !link || !src) return;

    btn.hidden = false;
    link.tabIndex = -1;
    link.setAttribute('aria-hidden', 'true');

    btn.addEventListener('click', () => {
      const iframe = document.createElement('iframe');
      iframe.src = src;
      iframe.title = frame.dataset.title ?? 'YouTube video';
      iframe.allow = 'autoplay; encrypted-media; picture-in-picture';
      iframe.allowFullscreen = true;
      iframe.referrerPolicy = 'strict-origin-when-cross-origin';
      btn.remove();
      link.remove();
      frame.appendChild(iframe);
      iframe.focus();
    });
  });
}

// Two independent behaviors, both scoped to the work feed:
//  1. Each `[data-gallery]` (the inline row gallery and the fullscreen
//     slideshow gallery are each one) tracks its own current image.
//     Clicking the right half advances, the left half goes back. By
//     default there's no looping — the prev/next hit zones disable
//     themselves at the first/last image, which also removes their
//     cursor. A gallery marked `data-loop` (the homepage's hero gallery)
//     wraps instead, and its zones are never disabled.
//  2. Clicking a project's title opens its fullscreen slideshow dialog.

function setIndex(gallery: Element, index: number, loop: boolean) {
  const frames = Array.from(gallery.querySelectorAll<HTMLElement>('.gallery__frame'));
  frames.forEach((frame, i) => frame.classList.toggle('is-active', i === index));

  const prev = gallery.querySelector<HTMLButtonElement>('[data-gallery-prev]');
  const next = gallery.querySelector<HTMLButtonElement>('[data-gallery-next]');
  if (prev) prev.disabled = !loop && index === 0;
  if (next) next.disabled = !loop && index === frames.length - 1;
}

document.querySelectorAll<HTMLElement>('[data-gallery]').forEach((gallery) => {
  const loop = gallery.hasAttribute('data-loop');
  const frameCount = gallery.querySelectorAll('.gallery__frame').length;
  const activeIndex = Array.from(gallery.querySelectorAll('.gallery__frame')).findIndex((f) =>
    f.classList.contains('is-active'),
  );
  let current = activeIndex === -1 ? 0 : activeIndex;
  setIndex(gallery, current, loop);

  gallery.querySelector('[data-gallery-prev]')?.addEventListener('click', () => {
    if (current > 0) {
      setIndex(gallery, (current -= 1), loop);
    } else if (loop) {
      setIndex(gallery, (current = frameCount - 1), loop);
    }
  });

  gallery.querySelector('[data-gallery-next]')?.addEventListener('click', () => {
    if (current < frameCount - 1) {
      setIndex(gallery, (current += 1), loop);
    } else if (loop) {
      setIndex(gallery, (current = 0), loop);
    }
  });
});

document.querySelectorAll<HTMLButtonElement>('[data-open-slideshow]').forEach((button) => {
  const dialog = document.getElementById(button.dataset.openSlideshow ?? '');
  if (dialog instanceof HTMLDialogElement) {
    button.addEventListener('click', () => dialog.showModal());
  }
});

// Same "click anywhere outside the photo to exit" behavior as the frames
// lightbox — only a click landing directly on the dialog (the margin, not
// the gallery viewer or its zones) closes it.
document.querySelectorAll<HTMLDialogElement>('[data-slideshow]').forEach((dialog) => {
  dialog.addEventListener('click', (event) => {
    if (event.target === dialog) dialog.close();
  });
});

// Four independent behaviors, all scoped to the work feed:
//  1. Each `[data-gallery]` (the inline row gallery and the fullscreen
//     slideshow gallery are each one) tracks its own current image.
//     Clicking the right half advances, the left half goes back. By
//     default there's no looping — the prev/next hit zones disable
//     themselves at the first/last image, which also removes their
//     cursor. A gallery marked `data-loop` (every gallery, currently)
//     wraps instead, and its zones are never disabled.
//  2. Clicking a project's title opens its fullscreen slideshow dialog.
//  3. Any <video> in a slide plays (with sound — this only works because
//     it's called synchronously from the click handler below, inside the
//     user-gesture window browsers require for unmuted autoplay) when its
//     frame becomes active, and stops (paused, rewound) the moment it
//     doesn't. Generic — works for any project's video slide, not
//     special-cased to Cymatic Ceiling's.
//  4. That same video also stops if you leave it *without* changing
//     slides — scrolling the inline gallery out of view, or closing the
//     fullscreen dialog (clicking off, or Escape). Advancing to a
//     different slide already stops it via #3; this covers the two ways
//     of leaving that don't go through setIndex at all.

function pauseVideos(scope: ParentNode) {
  scope.querySelectorAll<HTMLVideoElement>('video').forEach((video) => {
    video.pause();
    video.currentTime = 0;
  });
}

function setIndex(gallery: Element, index: number, loop: boolean) {
  const frames = Array.from(gallery.querySelectorAll<HTMLElement>('.gallery__frame'));
  frames.forEach((frame, i) => {
    const active = i === index;
    frame.classList.toggle('is-active', active);
    const video = frame.querySelector('video');
    if (video) {
      if (active) {
        video.currentTime = 0;
        video.play().catch(() => {});
      } else {
        pauseVideos(frame);
      }
    }
  });

  const prev = gallery.querySelector<HTMLButtonElement>('[data-gallery-prev]');
  const next = gallery.querySelector<HTMLButtonElement>('[data-gallery-next]');
  if (prev) prev.disabled = !loop && index === 0;
  if (next) next.disabled = !loop && index === frames.length - 1;

  // Scoped listeners (see cymaticDarkMode.ts) pick this up via bubbling
  // from whichever gallery changed — the event itself stays generic
  // rather than knowing about any one project's behavior.
  gallery.dispatchEvent(new CustomEvent('gallery:index', { detail: { index }, bubbles: true }));
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

  // Lets outside code (see introHero.ts) jump this gallery straight to a
  // specific slide — e.g. carrying over whichever image the homepage
  // hero was showing when it handed off to Project 1's real gallery —
  // without reaching into `current`, which is private to this closure.
  gallery.addEventListener('gallery:set-index', (event) => {
    const requested = (event as CustomEvent<{ index: number }>).detail.index;
    if (requested >= 0 && requested < frameCount) {
      setIndex(gallery, (current = requested), loop);
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

  // 'close' fires for both a click-off (.close() above) and Escape (the
  // dialog's own native handling) — one listener covers both.
  if (dialog.querySelector('video')) {
    dialog.addEventListener('close', () => pauseVideos(dialog));
  }
});

// Stops a playing video if its gallery scrolls out of view without ever
// changing slides — e.g. scrolling past the project entirely while its
// video slide is still the active one.
document.querySelectorAll<HTMLElement>('[data-gallery]').forEach((gallery) => {
  if (!gallery.querySelector('video')) return;
  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) pauseVideos(gallery);
      }
    },
    { threshold: 0.1 },
  );
  observer.observe(gallery);
});

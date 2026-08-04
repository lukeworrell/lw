// One-off request for the "Cymatic Ceiling" project: from its video slide
// onward, the whole site flips to dark mode — everything that reads
// var(--color-bg)/var(--color-fg) inverts (see the .is-dark-mode overrides
// in global.css and ProjectEntry.astro), transitioning smoothly rather
// than snapping. Bidirectional: going back to slide 0 or 1 (the two
// opening gifs) reverts to light, going forward re-enters it — it isn't a
// one-way latch. Scrolling this project out of view (or leaving the page,
// which resets it for free) also forces it back off, as a catch-all for
// however you leave the gallery.
//
// --color-bg while dark isn't a single fixed color — the video's walls,
// the grasshopper study's background, and the panel study's background
// are each a visibly different near-black, and matching the one actually
// on screen (rather than one flat approximation) is what the "some of the
// blacks vary slightly" request is about. Sampled directly from each
// slide's own image/frame.
//
// Scoped entirely to this one project's own galleries: projectGallery.ts
// dispatches a generic 'gallery:index' event on every slide change (any
// gallery, any project) that bubbles up to the containing <article>, so
// listening on just this article's subtree — rather than teaching the
// generic script about Cymatic Ceiling specifically — is what keeps that
// script project-agnostic.

const SLUG = 'cymatic-ceiling';
// The video slide (0-indexed) — everything from here on (video, then the
// two closing gif studies) is the "dark" half of the deck.
const DARK_FROM_INDEX = 2;

// Per-slide background, sampled from each one's own dominant/background
// tone (see the commit that added this). Falls back to the video's shade
// for any index beyond what's listed, rather than nothing.
const DARK_BG_BY_INDEX: Record<number, string> = {
  2: '#323232', // video (probes-detail.mp4) — its wall color
  3: '#000000', // grasshopper-study.gif — true black, per direct correction
  4: '#000000', // panel-module-study.gif
};

const article = document.querySelector<HTMLElement>(`[data-slug="${SLUG}"]`);

if (article) {
  function setDark(on: boolean, index?: number) {
    document.documentElement.classList.toggle('is-dark-mode', on);
    if (on) {
      const bg = (index !== undefined && DARK_BG_BY_INDEX[index]) || DARK_BG_BY_INDEX[DARK_FROM_INDEX];
      document.documentElement.style.setProperty('--color-bg', bg);
    } else {
      document.documentElement.style.removeProperty('--color-bg');
    }
  }

  article.addEventListener('gallery:index', (event) => {
    const index = (event as CustomEvent<{ index: number }>).detail?.index;
    if (typeof index === 'number') {
      setDark(index >= DARK_FROM_INDEX, index);
    }
  });

  // Revert once the project itself has scrolled out of view — a fairly
  // generous threshold (mostly gone, not just no-longer-perfectly-
  // centered) so it doesn't flicker off during an in-progress scroll
  // snap that's about to settle back on it.
  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) setDark(false);
      }
    },
    { threshold: 0.1 },
  );
  observer.observe(article);
}

// One-off request for the "Cymatic Ceiling" project: reaching its video
// slide or beyond — either forward past the title-card slide, or
// backward (the gallery loops) straight to the panel-module-study gif at
// the end — flips the whole site to dark mode: everything that reads
// var(--color-bg)/var(--color-fg) inverts (see the .is-dark-mode
// overrides in global.css and ProjectEntry.astro), transitioning
// smoothly rather than snapping. Once triggered, it's a latch, not a
// per-slide toggle — cycling back to the title card or opening gif
// afterward keeps dark mode on (the title card swaps to its black-
// background version instead, see .cymatic-sound-- in ProjectEntry.astro,
// so it doesn't read as a jarring white slide).
//
// Scrolling this project out of view turns dark mode off — visually —
// but the fact that it had triggered is remembered (not reset), and the
// gallery's own current slide doesn't change just because you scrolled
// away from it. So scrolling back finds both still true and restores
// dark mode immediately, matching whatever slide is still showing,
// without needing to click through the gallery again. Swipe off, swipe
// back: dark again. Swipe off again: light again, every time. A real
// page navigation resets everything for free, since nothing here
// persists across one.
//
// --color-bg while dark isn't a single fixed color — the video's walls,
// the grasshopper study's background, and the panel study's background
// are each a visibly different near-black, and matching the one actually
// on screen (rather than one flat approximation) is what "some of the
// blacks vary slightly" was about. Sampled directly from each slide's
// own image/frame.
//
// Scoped entirely to this one project's own galleries: projectGallery.ts
// dispatches a generic 'gallery:index' event on every slide change (any
// gallery, any project) that bubbles up to the containing <article>, so
// listening on just this article's subtree — rather than teaching the
// generic script about Cymatic Ceiling specifically — is what keeps that
// script project-agnostic.

const SLUG = 'cymatic-ceiling';
// The video slide (0-indexed) — everything from here on (video, then the
// two closing gif studies) is what triggers the dark half of the deck.
const DARK_FROM_INDEX = 2;

// Per-slide background, sampled from each one's own dominant/background
// tone. Index 0 (the ceiling render) has no single flat tone to sample —
// it only shows up here at all because the latch means you can land back
// on it after dark mode has already triggered — so it falls back to a
// plain neutral dark instead of an actual sample.
const DARK_BG_BY_INDEX: Record<number, string> = {
  0: '#0a0a0a', // ceiling-render.gif — no flat background to sample; plain neutral
  1: '#000000', // sound-statement slide, once swapped to its dark/black version
  2: '#323232', // video (probes-detail.mp4) — its wall color
  3: '#000000', // grasshopper-study.gif — true black
  4: '#000000', // panel-module-study.gif
};

const article = document.querySelector<HTMLElement>(`[data-slug="${SLUG}"]`);

if (article) {
  // Sticky for the rest of the page session — set once slide 2+ is ever
  // reached, never cleared by scrolling away. What scrolling away clears
  // is only the *visual* dark-mode state (see the observer below).
  let triggered = false;
  // The gallery's own active slide persists while scrolled away (nothing
  // resets it just because it's off-screen) — tracked here too so the
  // observer can restore the right shade of dark on return without
  // waiting for a 'gallery:index' event that scrolling alone won't fire.
  let currentIndex = 0;

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
    if (typeof index !== 'number') return;
    currentIndex = index;
    if (index >= DARK_FROM_INDEX) triggered = true;
    // Once triggered, every subsequent slide change (either direction)
    // keeps dark mode on and just updates which shade of "dark" matches
    // whatever's now on screen — it doesn't turn back off by navigating
    // to an earlier slide.
    if (triggered) setDark(true, index);
  });

  // Scrolling away always goes light (visually) regardless of whether
  // this project had triggered dark mode; scrolling back restores it
  // immediately if it had, using whatever slide is still active. A
  // fairly generous intersection threshold (mostly gone/back, not just
  // no-longer-perfectly-centered) so it doesn't flicker during an
  // in-progress scroll snap that's about to settle back on it.
  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          if (triggered) setDark(true, currentIndex);
        } else {
          setDark(false);
        }
      }
    },
    { threshold: 0.1 },
  );
  observer.observe(article);
}

// One-off request for the "Cymatic Ceiling" project: advancing past its
// second slide (the "sound you can hear, feel, and see" / "translucent
// membrane..." gif) flips the whole site to dark mode — everything that
// reads var(--color-bg)/var(--color-fg) inverts (see the .is-dark-mode
// overrides in global.css and ProjectEntry.astro) — and it stays that
// way regardless of navigating back and forth within the gallery after
// that point, until either this project scrolls out of view or the user
// leaves the page (which resets it for free — nothing here persists
// across a real navigation).
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

const article = document.querySelector<HTMLElement>(`[data-slug="${SLUG}"]`);

if (article) {
  function setDark(on: boolean) {
    document.documentElement.classList.toggle('is-dark-mode', on);
  }

  article.addEventListener('gallery:index', (event) => {
    const index = (event as CustomEvent<{ index: number }>).detail?.index;
    if (typeof index === 'number' && index >= DARK_FROM_INDEX) {
      setDark(true);
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

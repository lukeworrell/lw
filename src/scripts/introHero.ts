// Shrinks the fixed fullscreen intro image down to exactly overlay
// whichever project's real gallery box is currently first in the feed,
// as you scroll through the intro spacer, then hides the decoy so that
// real element (already sitting there in normal flow) takes over. Locks
// that project's gallery zones until the handoff completes, so nothing
// is clickable mid-transition. Also reveals the site header's band +
// nav (see SiteHeader.astro's data-defer-reveal) at that same arrival
// moment.
//
// Whichever project's hero image you're looking at (see the hero
// gallery in index.astro) when you start scrolling away from the top
// becomes that "first" project: syncTargetToHero() moves its real
// <article> to the front of .feed, retargets the shrink animation at
// its gallery, and carries the #first-project anchor + locked/hidden
// state along with it — all exactly once, right as you leave the top,
// before the decoy has moved far enough for any of this to be visible.
//
// The target's top position depends on scroll (it's normal-flow
// content), but its left/width/height don't — only viewport width does.
// So `documentOffsetTop` (a scroll-independent constant) is measured
// once per target, and the target's position at any scroll offset is
// just `documentOffsetTop - scrollY`. That lets the intro's end-state be
// computed directly instead of chasing a value that's itself moving.

const intro = document.querySelector<HTMLElement>('[data-intro]');
const spacer = document.querySelector<HTMLElement>('[data-intro-spacer]');
const feed = document.querySelector<HTMLElement>('.feed');
const header = document.querySelector<HTMLElement>('[data-site-header]');

let target = document.querySelector<HTMLElement>('[data-project] .project__gallery');
let targetArticle = target?.closest<HTMLElement>('[data-project]') ?? null;

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

if (intro && spacer && feed && target && targetArticle) {
  let documentOffsetTop = 0;
  let restLeft = 0;
  let restWidth = 0;
  let restHeight = 0;
  // Whether the feed has already been synced to the hero gallery's
  // selection for the current departure from the top. Reset once you
  // scroll back up to p === 0, so the next departure re-checks.
  let hasSynced = false;

  function measure() {
    const rect = target!.getBoundingClientRect();
    documentOffsetTop = rect.top + window.scrollY;
    restLeft = rect.left;
    restWidth = rect.width;
    restHeight = rect.height;
  }

  // Moves whichever project the hero gallery is currently showing to the
  // front of .feed, retargets the shrink animation at its gallery, and
  // carries the #first-project anchor + initial locked/hidden state over
  // from whichever project held them before. Returns whether a move
  // actually happened.
  function syncTargetToHero(): boolean {
    const activeFrame = intro!.querySelector<HTMLElement>('.gallery__frame.is-active');
    const heroIndex = activeFrame?.dataset.index;
    const selected = heroIndex !== undefined ? document.querySelector<HTMLElement>(`[data-hero-index="${heroIndex}"]`) : null;
    if (!selected || selected === targetArticle) return false;

    targetArticle!.removeAttribute('id');
    targetArticle!.querySelector('.project__gallery')?.classList.remove('is-locked');

    feed!.insertBefore(selected, feed!.firstElementChild);
    const newTarget = selected.querySelector<HTMLElement>('.project__gallery');
    if (!newTarget) return false;

    selected.id = 'first-project';
    target = newTarget;
    targetArticle = selected;
    measure();
    return true;
  }

  let ticking = false;

  function update() {
    const distance = spacer!.offsetHeight;
    const p = Math.min(1, Math.max(0, window.scrollY / distance));

    if (p > 0 && !hasSynced) {
      hasSynced = true;
      const reordered = syncTargetToHero();
      if (reordered && window.scrollY !== distance * p) {
        // Moving a project to the front of .feed shifts where any given
        // amount of scroll now lands (a different, possibly taller or
        // shorter, project is ahead of it). Re-express the same scroll
        // progress (p) in the post-reorder layout, rather than leave the
        // raw pixel position pointing at whatever now happens to sit
        // there — otherwise a fast/large scroll (a big trackpad fling, a
        // Page Down) could land well past the target instead of on it.
        window.scrollTo(0, distance * p);
      }
    } else if (p === 0) {
      hasSynced = false;
    }

    const restTop = documentOffsetTop - distance;

    intro!.style.top = `${lerp(0, restTop, p)}px`;
    intro!.style.left = `${lerp(0, restLeft, p)}px`;
    intro!.style.width = `${lerp(window.innerWidth, restWidth, p)}px`;
    intro!.style.height = `${lerp(window.innerHeight, restHeight, p)}px`;

    const arrived = p >= 1;
    intro!.classList.toggle('is-done', arrived);
    target!.classList.toggle('is-locked', !arrived);
    header?.classList.toggle('is-revealed', arrived);

    ticking = false;
  }

  measure();
  update();

  window.addEventListener(
    'scroll',
    () => {
      if (!ticking) {
        requestAnimationFrame(update);
        ticking = true;
      }
    },
    { passive: true },
  );

  window.addEventListener('resize', () => {
    measure();
    update();
  });
}

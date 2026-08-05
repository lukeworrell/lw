// Shrinks the fixed fullscreen intro image down to exactly overlay
// Project 1's real gallery box, as you scroll through the intro spacer,
// then hides the decoy so that real element (already sitting there in
// normal flow) takes over. Locks that project's gallery zones until the
// handoff completes, so nothing is clickable mid-transition. Also
// reveals the site header's band + nav (see SiteHeader.astro's
// data-defer-reveal) at that same arrival moment.
//
// The intro hero shows a curated set of Project 1's own images (see
// index.astro), soft-crossfading between them on its own timer,
// endlessly — purely to watch, not to click through. It stays fullscreen
// until you deliberately move on: scrolling or clicking anywhere on it
// both hand off to Project 1 the same way.
//
// That handoff only ever happens once, forward. Scrolling back up past
// Project 1 deliberately does NOT regrow the intro — with projects of
// very different images now sitting where the hero used to be, scrolling
// through them and having an unrelated photo suddenly balloon into a
// fullscreen hero read as broken, not smooth (see hasArrived below, and
// its matching check in scrollPaging.ts). The only way back to the hero
// from then on is the site name in the header — left as a plain link to
// "/" with no JS interception, so clicking it is a real navigation: a
// fresh load of this same page, landing exactly where a first-ever visit
// does (fullscreen hero, band/nav hidden, grey "LW"), not a return to
// wherever you'd scrolled to.
//
// The target's top position depends on scroll (it's normal-flow
// content), but its left/width/height don't — only viewport width does.
// So `documentOffsetTop` (a scroll-independent constant) is measured
// once, and the target's position at any scroll offset is just
// `documentOffsetTop - scrollY`. That lets the intro's end-state be
// computed directly instead of chasing a value that's itself moving.

// Browsers restore the previous scroll position on a plain reload by
// default (history.scrollRestoration === 'auto') — landing scrolled deep
// into the feed on reload, past a hero that (per the file-level comment)
// no longer scrolls back into view, defeats the whole "site name is the
// only way back to the fullscreen landing" design. Opting out and
// forcing scroll to the top handles that, without fighting the "work"
// nav link's deliberate #first-project jump (its URL carries a hash;
// this only resets when there isn't one).
if ('scrollRestoration' in history) {
  history.scrollRestoration = 'manual';
}
if (!location.hash) {
  window.scrollTo(0, 0);
}

const intro = document.querySelector<HTMLElement>('[data-intro]');
const spacer = document.querySelector<HTMLElement>('[data-intro-spacer]');
const header = document.querySelector<HTMLElement>('[data-site-header]');
const target = document.querySelector<HTMLElement>('[data-project] .project__gallery');

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

// p tracks scroll fraction directly, which is linear — every pixel of
// scroll moves the box the same amount regardless of how far into the
// shrink it already is. That reads as mechanical, tied a little too
// literally to the scrollbar. Easing the value used for the actual
// visual lerp (not p itself, which the arrival check below still needs
// raw) makes the motion ease out toward its resting place instead, which
// is what actually reads as "smooth" rather than "linear."
function easeOutCubic(t: number) {
  return 1 - (1 - t) ** 3;
}

if (intro && spacer && target) {
  let documentOffsetTop = 0;
  let restLeft = 0;
  let restWidth = 0;
  let restHeight = 0;

  function measure() {
    const rect = target!.getBoundingClientRect();
    documentOffsetTop = rect.top + window.scrollY;
    restLeft = rect.left;
    restWidth = rect.width;
    restHeight = rect.height;
  }

  // Same destination and easing as the auto-cycle handoff below (both
  // just move window.scrollY; update() below reacts to either
  // identically), so scrolling back up mid-shrink to cancel back to
  // fullscreen still retraces the exact same motion in reverse.
  function goToFirstProject() {
    const marginTop = parseFloat(getComputedStyle(target!).scrollMarginTop) || 0;
    const targetY = target!.getBoundingClientRect().top + window.scrollY - marginTop;
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    window.scrollTo({ top: targetY, behavior: reduceMotion ? 'auto' : 'smooth' });
  }

  // Soft-crossfades through the curated hero images on a timer, looping
  // forever — purely ambient, never advances the page on its own. Runs
  // only while actually sitting at the top (p===0, see update() below).
  const HERO_INTERVAL_MS = 3500;
  const heroFrames = Array.from(intro.querySelectorAll<HTMLElement>('.gallery__frame'));
  let heroIndex = 0;
  let heroTimer: ReturnType<typeof setInterval> | undefined;

  function showHeroFrame(i: number) {
    heroFrames.forEach((frame, idx) => frame.classList.toggle('is-active', idx === i));
  }

  function advanceHero() {
    heroIndex = (heroIndex + 1) % heroFrames.length;
    showHeroFrame(heroIndex);
  }

  function startHeroCycle() {
    if (heroTimer || heroFrames.length <= 1) return;
    heroTimer = setInterval(advanceHero, HERO_INTERVAL_MS);
  }

  function stopHeroCycle() {
    clearInterval(heroTimer);
    heroTimer = undefined;
  }

  // Whichever hero image was showing at the moment you moved on is the
  // one that should still be showing once the real gallery takes over —
  // not always that gallery's own actual first slide. data-target-index
  // (see index.astro) maps a curated hero frame back to its real position
  // in Project 1's full deck; projectGallery.ts owns that gallery's own
  // notion of "current" slide, so this asks it to jump there via a custom
  // event rather than reaching into that private state directly.
  function syncGalleryToHeroFrame() {
    const activeHeroFrame = intro!.querySelector<HTMLElement>('.gallery__frame.is-active');
    const realIndex = Number(activeHeroFrame?.dataset.targetIndex);
    if (Number.isNaN(realIndex)) return;
    target!.dispatchEvent(new CustomEvent('gallery:set-index', { detail: { index: realIndex } }));
  }

  // Whether the last update() found us resting exactly at the top —
  // tracked so the cycle only resets/(re)starts on the transition back to
  // p===0, not on every scroll event that happens to still read p===0
  // (e.g. rubber-band bounce at the top), which would otherwise restart
  // the cycle from frame 0 mid-scroll-wobble instead of just leaving it
  // running.
  let wasAtTop = true;
  let ticking = false;

  // Latches true the first time the shrink fully lands on Project 1, and
  // stays true forever after — once set, update() (the scroll-driven
  // shrink) is permanently inert, so nothing scroll does from then on can
  // bring the intro back. See the file-level comment.
  let hasArrived = false;

  function update() {
    if (hasArrived) return;

    const distance = spacer!.offsetHeight;
    const p = Math.min(1, Math.max(0, window.scrollY / distance));
    const atTop = p === 0;

    if (atTop && !wasAtTop) {
      heroIndex = 0;
      showHeroFrame(0);
      startHeroCycle();
    } else if (!atTop && wasAtTop) {
      syncGalleryToHeroFrame();
      stopHeroCycle();
    }
    wasAtTop = atTop;

    const restTop = documentOffsetTop - distance;
    const pVisual = easeOutCubic(p);

    intro!.style.top = `${lerp(0, restTop, pVisual)}px`;
    intro!.style.left = `${lerp(0, restLeft, pVisual)}px`;
    intro!.style.width = `${lerp(window.innerWidth, restWidth, pVisual)}px`;
    intro!.style.height = `${lerp(window.innerHeight, restHeight, pVisual)}px`;

    if (p >= 1) {
      hasArrived = true;
      // Lets scrollPaging.ts know to stop treating the intro spacer as a
      // valid step-backward destination — see the file-level comment.
      document.documentElement.classList.add('intro-arrived');
      intro!.classList.add('is-done');
      target!.classList.remove('is-locked');
      header?.classList.add('is-revealed');
    }

    ticking = false;
  }

  // Clicking anywhere on the fullscreen hero is a second, deliberate way
  // to move on — same destination as scrolling.
  intro.addEventListener('click', () => goToFirstProject());

  measure();
  startHeroCycle();
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

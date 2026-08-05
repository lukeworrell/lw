// Shrinks the fixed fullscreen intro image down to exactly overlay
// Project 1's real gallery box, as you scroll through the intro spacer,
// then hides the decoy so that real element (already sitting there in
// normal flow) takes over. Locks that project's gallery zones until the
// handoff completes, so nothing is clickable mid-transition. Also
// reveals the site header's band + nav (see SiteHeader.astro's
// data-defer-reveal) at that same arrival moment.
//
// The intro hero shows Project 1's own full image deck (see index.astro)
// rather than a cross-project sampler, so there's only ever one handoff
// target — no runtime selection to make.
//
// The target's top position depends on scroll (it's normal-flow
// content), but its left/width/height don't — only viewport width does.
// So `documentOffsetTop` (a scroll-independent constant) is measured
// once, and the target's position at any scroll offset is just
// `documentOffsetTop - scrollY`. That lets the intro's end-state be
// computed directly instead of chasing a value that's itself moving.

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

  let ticking = false;

  function update() {
    const distance = spacer!.offsetHeight;
    const p = Math.min(1, Math.max(0, window.scrollY / distance));

    const restTop = documentOffsetTop - distance;
    const pVisual = easeOutCubic(p);

    intro!.style.top = `${lerp(0, restTop, pVisual)}px`;
    intro!.style.left = `${lerp(0, restLeft, pVisual)}px`;
    intro!.style.width = `${lerp(window.innerWidth, restWidth, pVisual)}px`;
    intro!.style.height = `${lerp(window.innerHeight, restHeight, pVisual)}px`;

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

  // Clicking through the whole hero deck is a second, faster way to
  // reach Project 1 — instead of requiring a scroll/swipe once you've
  // already seen every image. Same destination and easing as the
  // scroll-driven handoff above (both just move window.scrollY; update()
  // above reacts to either identically), so scrolling back up afterward
  // retraces the exact same motion in reverse, at the same speed.
  function goToFirstProject() {
    const marginTop = parseFloat(getComputedStyle(target!).scrollMarginTop) || 0;
    const targetY = target!.getBoundingClientRect().top + window.scrollY - marginTop;
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    window.scrollTo({ top: targetY, behavior: reduceMotion ? 'auto' : 'smooth' });
  }

  // The hero gallery keeps data-loop (see index.astro) so its next/prev
  // zones are never disabled — a disabled button can't dispatch the
  // click this needs to intercept. Listening on `document` with capture
  // fires before projectGallery.ts's own listener (attached directly to
  // the button), since capturing visits ancestors before the target —
  // stopping propagation here reliably pre-empts the generic handler's
  // wrap-to-first-slide behavior, substituting the handoff instead, only
  // on the one click that lands on the last image.
  document.addEventListener(
    'click',
    (event) => {
      if (!(event.target instanceof Element)) return;
      const nextZone = event.target.closest('[data-gallery-next]');
      if (!nextZone || !intro!.contains(nextZone)) return;

      const frames = Array.from(intro!.querySelectorAll('.gallery__frame'));
      const activeIndex = frames.findIndex((frame) => frame.classList.contains('is-active'));
      if (activeIndex !== frames.length - 1) return;

      event.stopPropagation();
      goToFirstProject();
    },
    true,
  );
}

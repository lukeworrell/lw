// Steps through the homepage one section at a time — the intro spacer,
// then each project's gallery in whatever order introHero.ts has
// currently arranged .feed into — instead of letting the browser's
// native trackpad momentum carry a single swipe across several projects
// at once (the original complaint: an ordinary swipe was skipping
// straight through the whole deck).
//
// One physical swipe = one step, via a native smooth scroll rather than
// an instant jump. That smooth scroll fires the same 'scroll' events an
// organic scroll would, so introHero.ts's shrink animation (the hero
// image landing on Project 1) plays out exactly as it does today —
// legible and a little dramatic, without needing a second, competing
// transition system.
//
// The tricky part: a single physical trackpad swipe doesn't fire one
// 'wheel' event, it fires a long stream of them — the finger's motion,
// then a decelerating "momentum" tail the OS keeps generating for a
// while after the finger lifts. Trying to detect where one gesture ends
// and the next begins (e.g. waiting for wheel events to go quiet) is
// fragile — momentum tails and quick successive swipes can both defeat
// it. Instead: the first wheel event triggers exactly one step and
// locks out *all* wheel input, unconditionally, until the resulting
// smooth scroll has actually finished (the native 'scrollend' event) —
// that guarantees at most one step per gesture no matter how many wheel
// events arrive or why, and unlike a fixed-duration timer, it can never
// expire early. A fixed timer raced the real animation: a tall
// project's smooth scroll can take longer to settle than a guessed
// cooldown, and a late momentum-tail event sneaking in after the timer
// expired but before the scroll had actually arrived would recalculate
// mid-flight — from wherever it happened to be at that instant, not
// from the real destination — which is what made a single deliberate
// swipe intermittently feel like it "didn't take" and needed a second
// one. FALLBACK_COOLDOWN_MS is just a safety net for browsers without
// 'scrollend' support (or the rare case goToStep didn't scroll at all,
// e.g. already at the last project, so 'scrollend' never fires) — it
// should essentially never be what actually unlocks things.

const FALLBACK_COOLDOWN_MS = 2000;

// Once the intro has fully handed off to Project 1 (see introHero.ts,
// which sets this class right as that happens), stepping backward no
// longer returns to the intro spacer — only clicking the site name does.
// Before that point (still mid-shrink), stepping back up to cancel back
// to fullscreen is still allowed, same as always.
function hasIntroArrived(): boolean {
  return document.documentElement.classList.contains('intro-arrived');
}

function getSnapPoints(includeSpacer: boolean): HTMLElement[] {
  const spacer = includeSpacer ? document.querySelector<HTMLElement>('[data-intro-spacer]') : null;
  const galleries = Array.from(document.querySelectorAll<HTMLElement>('.feed .project__gallery'));
  return [spacer, ...galleries].filter((el): el is HTMLElement => el !== null);
}

function snapTop(el: HTMLElement): number {
  const marginTop = parseFloat(getComputedStyle(el).scrollMarginTop) || 0;
  return el.getBoundingClientRect().top + window.scrollY - marginTop;
}

function goToStep(direction: 1 | -1) {
  const positions = getSnapPoints(direction > 0 || !hasIntroArrived()).map(snapTop);
  const current = window.scrollY;
  // A couple px of slack so floating-point/sub-pixel scroll positions
  // don't get stuck re-targeting the point they're already resting on.
  const SLACK = 2;

  let targetY: number | undefined;
  if (direction > 0) {
    targetY = positions.find((p) => p > current + SLACK);
  } else {
    targetY = [...positions].reverse().find((p) => p < current - SLACK);
  }
  if (targetY === undefined) return; // already at the first/last step

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  window.scrollTo({ top: targetY, behavior: reduceMotion ? 'auto' : 'smooth' });
}

// A short scroll (a nearby snap point — the intro's is deliberately
// short now) can genuinely finish, firing a real 'scrollend', before a
// strong swipe's momentum tail has stopped sending wheel events. Without
// this, that's indistinguishable from a deliberate second swipe thrown
// right after the first, and unlocking exactly on 'scrollend' would let
// it straight through — overshooting past the step that just landed.
// This buffer only has to outlast the *tail end* of a tail, not a whole
// gesture, so it's much shorter than FALLBACK_COOLDOWN_MS below.
const POST_SCROLL_SETTLE_MS = 350;

let locked = false;
let fallbackTimer: ReturnType<typeof setTimeout> | undefined;
let settleTimer: ReturnType<typeof setTimeout> | undefined;

function unlock() {
  locked = false;
  clearTimeout(fallbackTimer);
  clearTimeout(settleTimer);
}

window.addEventListener('scrollend', () => {
  clearTimeout(fallbackTimer);
  settleTimer = setTimeout(unlock, POST_SCROLL_SETTLE_MS);
});

window.addEventListener(
  'wheel',
  (event) => {
    if (Math.abs(event.deltaY) < 1) return;
    event.preventDefault();
    if (locked) return;

    locked = true;
    goToStep(event.deltaY > 0 ? 1 : -1);
    fallbackTimer = setTimeout(unlock, FALLBACK_COOLDOWN_MS);
  },
  { passive: false },
);

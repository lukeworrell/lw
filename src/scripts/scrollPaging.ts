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
// locks out *all* wheel input, unconditionally, for a fixed cooldown —
// long enough to outlast a real swipe's momentum tail. That guarantees
// at most one step per cooldown window no matter how many wheel events
// arrive or why; the only cost is that two deliberate swipes thrown
// back-to-back faster than the cooldown will merge into one, which is a
// far better failure mode than a single swipe flying through the deck.

const COOLDOWN_MS = 1100;

function getSnapPoints(): HTMLElement[] {
  const spacer = document.querySelector<HTMLElement>('[data-intro-spacer]');
  const galleries = Array.from(document.querySelectorAll<HTMLElement>('.feed .project__gallery'));
  return [spacer, ...galleries].filter((el): el is HTMLElement => el !== null);
}

function snapTop(el: HTMLElement): number {
  const marginTop = parseFloat(getComputedStyle(el).scrollMarginTop) || 0;
  return el.getBoundingClientRect().top + window.scrollY - marginTop;
}

function goToStep(direction: 1 | -1) {
  const positions = getSnapPoints().map(snapTop);
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

let locked = false;

window.addEventListener(
  'wheel',
  (event) => {
    if (Math.abs(event.deltaY) < 1) return;
    event.preventDefault();
    if (locked) return;

    locked = true;
    goToStep(event.deltaY > 0 ? 1 : -1);
    setTimeout(() => {
      locked = false;
    }, COOLDOWN_MS);
  },
  { passive: false },
);

// Two layout fixes for the work feed, both driven by the same
// per-project gallery measurement (the gallery's rendered box depends on
// whichever of --gallery-max-height or the available column width is
// the tighter constraint, so neither can be predicted from CSS alone):
//
// 1. Guarantees the next project never peeks into view at the bottom of
//    the screen while scroll-snapped to the current one, by setting
//    exactly enough margin-bottom to reach the bottom of the viewport
//    (never less than the CSS baseline, for whenever a gallery already
//    fills the available height on its own).
// 2. Positions the teammate-credits line (see .project__credits) to sit
//    just to the left of the gallery's own real left edge — a fixed CSS
//    offset can't do this, since the gallery's left edge moves depending
//    on that same width-vs-height constraint.

const band = document.querySelector<HTMLElement>('.site-band');
const projects = Array.from(document.querySelectorAll<HTMLElement>('[data-project]'));

// Gap between the credits text and the image's real left edge.
const CREDITS_GAP = 6;

function apply() {
  if (!band) return;
  const bandHeight = band.getBoundingClientRect().height;

  projects.forEach((project) => {
    const gallery = project.querySelector<HTMLElement>('.project__gallery');
    if (!gallery) return;

    // Captured once, before any inline override, so repeated calls (on
    // resize) always compare against the real CSS baseline rather than
    // a previous inline value.
    if (!project.dataset.baseMargin) {
      project.dataset.baseMargin = getComputedStyle(project).marginBottom;
    }
    const baseMargin = parseFloat(project.dataset.baseMargin);

    const galleryRect = gallery.getBoundingClientRect();

    // +1px covers sub-pixel rounding in the measured rects — without it,
    // a fractional-pixel shortfall could still let a sliver through.
    const needed = window.innerHeight - bandHeight - galleryRect.height + 1;
    project.style.marginBottom = `${Math.max(needed, baseMargin)}px`;

    const credits = project.querySelector<HTMLElement>('.project__credits');
    // Below 700px, ProjectEntry.astro's own media query takes over
    // (a plain static caption line — there's no left margin column left
    // to position a vertical sidebar into once the gallery goes
    // edge-to-edge). Clearing any inline left/bottom left over from a
    // wider viewport matters too: inline styles beat a stylesheet media
    // query, so without this a resize from desktop down to mobile would
    // leave the credits stuck at their last desktop position.
    if (credits && window.innerWidth <= 700) {
      credits.style.left = '';
      credits.style.bottom = '';
    } else if (credits) {
      const projectRect = project.getBoundingClientRect();
      // credits is positioned by its own left edge, so its rendered
      // width (its "thickness" as a column of vertical text) has to be
      // subtracted too — otherwise only its left edge sits the gap away
      // and its right edge (the side actually facing the image) overlaps
      // it instead.
      const creditsWidth = credits.getBoundingClientRect().width;
      credits.style.left = `${galleryRect.left - projectRect.left - CREDITS_GAP - creditsWidth}px`;

      // One-off request for the ZCA "Work Samples" credit specifically:
      // lifted up off the image's bottom edge by a quarter of its own
      // rendered height (raised a half, then brought back down by half
      // of that), rather than sitting flush with it like every other
      // project's credits.
      if (project.dataset.slug === 'zca-work-samples') {
        const creditsHeight = credits.getBoundingClientRect().height;
        credits.style.bottom = `${creditsHeight / 4}px`;
      }
    }
  });
}

apply();

let ticking = false;
window.addEventListener(
  'resize',
  () => {
    if (!ticking) {
      requestAnimationFrame(() => {
        apply();
        ticking = false;
      });
      ticking = true;
    }
  },
  { passive: true },
);

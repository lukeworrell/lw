// Two jobs for photos on the frames page, sequenced carefully since the
// second depends on the first:
//  1. Real lazy-loading via IntersectionObserver, instead of relying on
//     the browser's native `loading="lazy"` distance heuristic — with
//     60+ competing images in a masonry grid, that heuristic was starting
//     the fetch so late that photos visibly popped in well after they'd
//     already scrolled into view. Each lazy photo's real source URLs are
//     stashed up front, then restored (starting the real fetch) shortly
//     before the photo actually reaches the viewport.
//  2. Toggles .is-loaded once a photo's image actually finishes loading,
//     so the CSS grow-and-fade in frames.astro plays as each one becomes
//     real. Attached before any src is restored, so it always catches
//     the real load event rather than the trivial "complete" state of an
//     empty img.

const LOOKAHEAD = '500px';

const images = Array.from(document.querySelectorAll<HTMLImageElement>('.photo__image'));

images.forEach((img) => {
  const reveal = () => img.classList.add('is-loaded');
  const isLazy = img.getAttribute('loading') === 'lazy';
  if (!isLazy && img.complete) {
    reveal();
  } else {
    img.addEventListener('load', reveal, { once: true });
  }
});

const lazyImages = images.filter((img) => img.getAttribute('loading') === 'lazy');

if (lazyImages.length > 0) {
  const observer = new IntersectionObserver(
    (entries, obs) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const img = entry.target as HTMLImageElement;
        const picture = img.closest('picture');

        picture?.querySelectorAll<HTMLSourceElement>('source').forEach((source) => {
          if (source.dataset.srcset) source.srcset = source.dataset.srcset;
        });
        if (img.dataset.srcset) img.srcset = img.dataset.srcset;
        if (img.dataset.src) img.src = img.dataset.src;
        img.loading = 'eager';

        obs.unobserve(img);
      });
    },
    { rootMargin: `0px 0px ${LOOKAHEAD} 0px` },
  );

  lazyImages.forEach((img) => {
    const picture = img.closest('picture');
    picture?.querySelectorAll<HTMLSourceElement>('source').forEach((source) => {
      source.dataset.srcset = source.srcset;
      source.removeAttribute('srcset');
    });
    img.dataset.srcset = img.srcset;
    img.dataset.src = img.src;
    img.removeAttribute('srcset');
    img.removeAttribute('src');
    observer.observe(img);
  });
}

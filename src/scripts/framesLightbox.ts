// One shared lightbox for all photos, rather than one dialog per photo —
// keeps the DOM small and means each large (1800px) variant is only
// ever requested the moment its thumbnail (or a next/prev click) reveals
// it: the button just carries the precomputed URLs as data attributes
// until then, nothing is fetched upfront.
//
// Photos are addressed by their position in document order — every
// [data-photo] button on the page, spanning every category — so
// clicking through with next/prev moves continuously through the whole
// page, not just the category you opened it from.

const dialog = document.querySelector<HTMLDialogElement>('[data-lightbox]');
const viewer = document.querySelector<HTMLElement>('[data-lightbox-viewer]');
const img = document.querySelector<HTMLImageElement>('[data-lightbox-img]');
const webpSource = document.querySelector<HTMLSourceElement>('[data-lightbox-webp]');
const caption = document.querySelector<HTMLElement>('[data-lightbox-caption]');
const prevZone = document.querySelector<HTMLButtonElement>('[data-lightbox-prev]');
const nextZone = document.querySelector<HTMLButtonElement>('[data-lightbox-next]');

const photos = Array.from(document.querySelectorAll<HTMLButtonElement>('[data-photo]'));

let currentIndex = -1;

if (dialog && viewer && img && webpSource && caption && prevZone && nextZone) {
  const openAt = (index: number) => {
    const button = photos[index];
    if (!button) return;
    currentIndex = index;

    webpSource.srcset = button.dataset.fullWebp ?? '';
    img.src = button.dataset.fullJpg ?? '';
    img.alt = button.dataset.alt ?? '';
    viewer.style.setProperty('--ratio', button.dataset.ratio ?? '1');
    caption.textContent = button.dataset.label ?? '';

    prevZone.disabled = index === 0;
    nextZone.disabled = index === photos.length - 1;

    if (!dialog.open) dialog.showModal();
  };

  photos.forEach((button, index) => {
    button.addEventListener('click', () => openAt(index));
  });

  prevZone.addEventListener('click', () => {
    if (currentIndex > 0) openAt(currentIndex - 1);
  });

  nextZone.addEventListener('click', () => {
    if (currentIndex < photos.length - 1) openAt(currentIndex + 1);
  });

  // Only a click that lands directly on the dialog itself — the film
  // outside the photo, since the zones above cover the photo entirely —
  // closes it. Escape closes it too, natively, since this is a real
  // <dialog> opened with showModal().
  dialog.addEventListener('click', (event) => {
    if (event.target === dialog) dialog.close();
  });
}

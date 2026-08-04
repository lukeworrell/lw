import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

// Order here is the order projects appear on the homepage feed within
// each category — sorted by "year" descending inside each category.
export const workCategories = [
  'undergraduate',
  'internship',
  'personal',
  'high-school',
] as const;

const work = defineCollection({
  // Each project is a folder at src/content/work/<slug>/index.md
  loader: glob({ pattern: '*/index.md', base: './src/content/work' }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      year: z.number(),
      // Free-text second label line, e.g. "Studio Name — 2025 — Location".
      meta: z.string(),
      category: z.enum(workCategories),
      description: z.string(),
      // Credits teammates on group projects — omitted for solo work.
      // Rendered as a single "Name | Name" line under the subtitle.
      teammates: z.array(z.string()).optional(),
      images: z.array(
        z.union([
          z.object({
            src: image(),
            alt: z.string(),
          }),
          // An animated GIF, referenced by a plain public/ path instead
          // of going through Astro's image() pipeline — that pipeline
          // generates static AVIF/WebP variants and would flatten the
          // animation to a single frame. Rendered as a plain <img> so
          // the browser plays it natively. width/height are optional —
          // only needed when a gif is images[0] (the cover), since that's
          // the only place the gallery box's aspect ratio is read from,
          // and a gif (unlike src) carries no dimensions of its own for
          // ProjectEntry.astro to read.
          z.object({
            gif: z.string(),
            alt: z.string(),
            width: z.number().optional(),
            height: z.number().optional(),
          }),
          // A video, referenced by a plain public/ path for the same
          // reason as gif above. Rendered as a plain <video> — played
          // and paused by projectGallery.ts as its slide becomes active/
          // inactive, rather than autoplaying/looping on its own.
          z.object({
            video: z.string(),
            alt: z.string(),
          }),
        ]),
      ),
    }),
});

// Display order down the /frames page — six clusters, no headings shown
// in the grid itself (the "label" field is only used as the caption
// when a photo is enlarged).
export const frameCategories = ['nyc', 'maine', 'boston', 'dc', 'misc', 'triangle-storage'] as const;

const frames = defineCollection({
  // Each category is a folder at src/content/frames/<slug>/index.md,
  // holding every photo in that category as one entry in "images".
  loader: glob({ pattern: '*/index.md', base: './src/content/frames' }),
  schema: ({ image }) =>
    z.object({
      category: z.enum(frameCategories),
      // Display name shown only as a caption when a photo from this
      // category is enlarged, e.g. "New York City".
      label: z.string(),
      images: z.array(
        z.object({
          src: image(),
          alt: z.string(),
          // Optional per-photo override for the lightbox caption, e.g.
          // "Zion National Park, UT — 1st place, ...". Falls back to
          // the category's "label" above when not set.
          caption: z.string().optional(),
        }),
      ),
    }),
});

export const collections = { work, frames };

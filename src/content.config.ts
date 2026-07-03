import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

/**
 * Projects collection. Uses the Content Layer API (Astro 5+/7). Frontmatter is
 * schema-validated at build time via Zod, so malformed content fails the build
 * instead of shipping silently.
 */
const projects = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/projects' }),
  schema: ({ image }) =>
    z.object({
      title: z.string().min(1).max(80),
      summary: z.string().min(1).max(200),
      description: z.string().optional(),
      date: z.coerce.date(),
      updated: z.coerce.date().optional(),
      tags: z.array(z.string()).default([]),
      role: z.string().optional(),
      stack: z.array(z.string()).default([]),
      links: z
        .object({
          repo: z.url().optional(),
          live: z.url().optional(),
          writeup: z.url().optional(),
        })
        .default({}),
      cover: image().optional(),
      coverAlt: z.string().optional(),
      featured: z.boolean().default(false),
      draft: z.boolean().default(false),
      order: z.number().int().optional(),
    }),
});

export const collections = { projects };

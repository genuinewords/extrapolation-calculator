import { defineCollection, z } from 'astro:content';

export const blogCollection = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    description: z.string(),
    publishDate: z.date(),
    author: z.string(),
    category: z.string(),
    featuredImage: z.string().optional(),
  }),
});

export const collections = {
  blog: blogCollection,
};

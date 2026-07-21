import { z } from 'zod';

export const BlogPostEntitySchema = z.object({
  id: z.string(),
  slug: z.string(),
  title: z.string(),
  content: z.string(),
  author: z.string(),
  is_published: z.boolean(),
  published_at: z.string(),
});

export const BlogPostSummarySchema = BlogPostEntitySchema.omit({
  content: true,
});

export type BlogPostEntity = z.infer<typeof BlogPostEntitySchema>;
export type BlogPostSummary = z.infer<typeof BlogPostSummarySchema>;

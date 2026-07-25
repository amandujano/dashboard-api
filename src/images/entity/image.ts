import { z } from 'zod';

export const ImageEntitySchema = z.object({
  id: z.string(),
  filename: z.string(),
  alt: z.string(),
  url_thumb: z.string(),
  url_medium: z.string(),
  url_full: z.string(),
  width: z.number(),
  height: z.number(),
  size_bytes: z.number(),
  created_at: z.string(),
});

export type ImageEntity = z.infer<typeof ImageEntitySchema>;

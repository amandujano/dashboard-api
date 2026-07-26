import { z } from 'zod';

export const CollectionEntitySchema = z.object({
  id: z.string(),
  name: z.string(),
  slug: z.string(),
  created_at: z.string(),
});

export type CollectionEntity = z.infer<typeof CollectionEntitySchema>;

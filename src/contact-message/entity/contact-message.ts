/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { z } from 'zod';

export const ContactMessageEntitySchema = z.object({
  id: z.int32().nullable(),
  name: z.string(),
  email: z.email(),
  message: z.string().max(500),
  created_at: z.coerce.date().nullable(),
  updated_at: z.coerce.date().nullable(),
});

// 2. Infer the TypeScript type from the schema
export type ContactMessageEntity = z.infer<typeof ContactMessageEntitySchema>;

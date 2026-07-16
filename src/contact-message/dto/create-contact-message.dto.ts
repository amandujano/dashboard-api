import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const CreateContactMessageSchema = z.object({
  name: z.string().min(1),
  email: z.email(),
  message: z.string().max(500),
});

export class CreateContactMessageDto extends createZodDto(
  CreateContactMessageSchema,
) {}

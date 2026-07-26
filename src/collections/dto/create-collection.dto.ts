import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const CreateCollectionSchema = z.object({
  name: z.string().min(1),
  slug: z
    .string()
    .min(1)
    .regex(
      /^[a-z0-9-]+$/,
      'El slug solo puede tener minúsculas, números y guiones',
    ),
});

export class CreateCollectionDto extends createZodDto(CreateCollectionSchema) {}

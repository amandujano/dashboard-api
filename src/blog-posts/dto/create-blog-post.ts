import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const CreateBlogPostSchema = z.object({
  slug: z.string().min(1),
  title: z.string().min(1),
  content: z.string().min(1),
  author: z.string().min(1),
  is_published: z.boolean().default(false),
});

export class CreateBlogPostDto extends createZodDto(CreateBlogPostSchema) {}

export const UpdateBlogPostSchema = CreateBlogPostSchema.partial();

export class UpdateBlogPostDto extends createZodDto(UpdateBlogPostSchema) {}

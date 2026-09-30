import { boolean, pgTable, text, uuid } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { timestamptz } from './columns';

export const blog_posts = pgTable('blog_posts', {
  id: uuid('id').primaryKey().defaultRandom(),
  created_at: timestamptz('created_at')
    .notNull()
    .default(sql`now()`),
  slug: text('slug').notNull().unique('blog_posts_slug_key'),
  title: text('title'),
  content: text('content'),
  is_published: boolean('is_published'),
  author: text('author'),
  published_at: timestamptz('published_at').default(sql`now()`),
});

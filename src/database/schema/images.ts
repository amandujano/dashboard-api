import { integer, pgTable, uuid, varchar } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { timestamptz } from './columns';

export const images = pgTable('images', {
  id: uuid('id').primaryKey().defaultRandom(),
  filename: varchar('filename'),
  alt: varchar('alt'),
  url_thumb: varchar('url_thumb'),
  url_medium: varchar('url_medium'),
  url_full: varchar('url_full'),
  width: integer('width'),
  height: integer('height'),
  size_bytes: integer('size_bytes'),
  created_at: timestamptz('created_at').default(sql`now()`),
});

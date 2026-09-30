import { pgTable, uuid, varchar } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { timestamptz } from './columns';

export const collections = pgTable('collections', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name'),
  slug: varchar('slug').notNull().unique('collections_slug_key'),
  created_at: timestamptz('created_at')
    .notNull()
    .default(sql`now()`),
});

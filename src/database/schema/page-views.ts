import { pgTable, uuid, varchar } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { timestamptz } from './columns';

export const page_views = pgTable('page_views', {
  id: uuid('id').primaryKey().defaultRandom(),
  visitor_hash: varchar('visitor_hash'),
  path: varchar('path'),
  country: varchar('country'),
  browser: varchar('browser'),
  created_at: timestamptz('created_at')
    .notNull()
    .default(sql`now()`),
});

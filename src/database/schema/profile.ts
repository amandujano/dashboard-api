import { bigint, pgTable, varchar } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { timestamptz } from './columns';

export const profile = pgTable('profile', {
  id: bigint('id', { mode: 'number' })
    .primaryKey()
    .generatedByDefaultAsIdentity({
      name: 'profile_id_seq',
      startWith: 1,
      increment: 1,
      cache: 1,
    }),
  created_at: timestamptz('created_at').default(sql`now()`),
  updated_at: timestamptz('updated_at').default(sql`now()`),
  name: varchar('name'),
  bio: varchar('bio'),
  description: varchar('description'),
});

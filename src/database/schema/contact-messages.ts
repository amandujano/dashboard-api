import { bigint, pgTable, varchar } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { timestamptz } from './columns';

export const contact_messages = pgTable('contact_messages', {
  id: bigint('id', { mode: 'number' })
    .primaryKey()
    .generatedByDefaultAsIdentity({
      name: 'contact-messages_id_seq',
      startWith: 1,
      increment: 1,
    }),
  created_at: timestamptz('created_at').default(sql`now()`),
  updated_at: timestamptz('updated_at').default(sql`now()`),
  name: varchar('name'),
  email: varchar('email'),
  message: varchar('message'),
});

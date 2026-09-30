import { pgTable, primaryKey, uuid } from 'drizzle-orm/pg-core';
import { collections } from './collections';
import { images } from './images';

// The composite primary key is what raises 23505 on duplicate pairs.
export const image_collections = pgTable(
  'image_collections',
  {
    image_id: uuid('image_id')
      .notNull()
      .references(() => images.id, { onDelete: 'cascade' }),
    collection_id: uuid('collection_id')
      .notNull()
      .references(() => collections.id, { onDelete: 'cascade' }),
  },
  (table) => [
    primaryKey({
      columns: [table.image_id, table.collection_id],
      name: 'image_collections_pkey',
    }),
  ],
);

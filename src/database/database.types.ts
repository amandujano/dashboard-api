import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import type { Sql } from 'postgres';
import type * as schema from './schema';

export type Database = PostgresJsDatabase<typeof schema> & { $client: Sql };

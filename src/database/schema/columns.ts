import { customType } from 'drizzle-orm/pg-core';

/**
 * timestamptz exposed as an ISO-8601 string (`2024-01-01T12:00:00.000Z`),
 * matching what the API returned with supabase-js.
 */
export const timestamptz = customType<{ data: string; driverData: string }>({
  dataType: () => 'timestamp with time zone',
  fromDriver: (value) => new Date(value).toISOString(),
});

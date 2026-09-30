/**
 * One-off migration: copies image files hosted on Vercel Blob into the public
 * Supabase Storage bucket `images` and rewrites the URLs in the `images` table.
 *
 * Dry-run by default; pass --apply to upload and update rows.
 * Nothing is ever deleted from Vercel Blob (kept as rollback).
 *
 *   yarn migrate:blob            # dry-run
 *   yarn migrate:blob -- --apply # perform the migration
 */
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import { eq } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from '../src/database/schema';

const BUCKET = 'images';
const APPLY = process.argv.includes('--apply');
const URL_COLUMNS = ['url_thumb', 'url_medium', 'url_full'] as const;

const isBlobUrl = (url: string): boolean => {
  try {
    return new URL(url).hostname.endsWith('.blob.vercel-storage.com');
  } catch {
    return false;
  }
};

/** Deterministic bucket path from the blob pathname, so re-runs are idempotent. */
const targetPath = (url: string): string =>
  decodeURIComponent(new URL(url).pathname).replace(/^\/+/, '');

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is not set`);
  return value;
}

async function main(): Promise<number> {
  const sql = postgres(requireEnv('DATABASE_URL'), { prepare: false });
  const db = drizzle(sql, { schema });
  const supabase = createClient(
    requireEnv('SUPABASE_URL'),
    requireEnv('SUPABASE_SERVICE_ROLE_KEY'),
  );
  const storage = supabase.storage.from(BUCKET);

  console.log(APPLY ? 'MODE: apply' : 'MODE: dry-run (use --apply to write)');

  let migrated = 0;
  let skipped = 0;
  let failed = 0;

  try {
    const rows = await db.select().from(schema.images);

    for (const row of rows) {
      const urls = URL_COLUMNS.map((column) => row[column]);
      if (!urls.some(isBlobUrl)) {
        skipped++;
        continue;
      }

      try {
        const next: Record<(typeof URL_COLUMNS)[number], string> = {
          url_thumb: row.url_thumb,
          url_medium: row.url_medium,
          url_full: row.url_full,
        };

        for (const column of URL_COLUMNS) {
          const source = row[column];
          if (!isBlobUrl(source)) continue; // already migrated / foreign

          const path = targetPath(source);
          console.log(`[${row.id}] ${column}: ${source} -> ${BUCKET}/${path}`);

          if (APPLY) {
            const response = await fetch(source);
            if (!response.ok) {
              throw new Error(`fetch ${source} failed: ${response.status}`);
            }
            const body = Buffer.from(await response.arrayBuffer());
            const { error } = await storage.upload(path, body, {
              contentType: response.headers.get('content-type') ?? 'image/webp',
              upsert: true,
            });
            if (error)
              throw new Error(`upload ${path} failed: ${error.message}`);
            next[column] = storage.getPublicUrl(path).data.publicUrl;
          }
        }

        if (APPLY) {
          // One update per image, only after all uploads succeeded.
          await db
            .update(schema.images)
            .set(next)
            .where(eq(schema.images.id, row.id));
        }
        migrated++;
      } catch (error) {
        failed++;
        console.error(
          `[${row.id}] FAILED:`,
          error instanceof Error ? error.message : error,
        );
      }
    }
  } finally {
    await sql.end();
  }

  console.log(
    `\nSummary (${APPLY ? 'applied' : 'dry-run'}): ` +
      `${APPLY ? 'migrated' : 'to migrate'}=${migrated} ` +
      `skipped=${skipped} failed=${failed}`,
  );
  return failed > 0 ? 1 : 0;
}

main()
  .then((code) => {
    process.exitCode = code;
  })
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });

export const IMAGES_BUCKET = 'images';

const PUBLIC_PREFIX = `/storage/v1/object/public/${IMAGES_BUCKET}/`;

/**
 * Turns an arbitrary file name into a lowercase, ASCII-safe storage key
 * segment (no extension). Falls back to "image" when nothing usable remains.
 */
export function sanitizeBaseName(originalName: string): string {
  const withoutExt = originalName.replace(/\.[^.]+$/, '');
  const safe = withoutExt
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60)
    .replace(/-+$/g, '');
  return safe || 'image';
}

/** Builds a unique object key such as `photo-thumb-1a2b3c4d.webp`. */
export function buildObjectKey(
  originalName: string,
  variant: string,
  uniqueId: string,
): string {
  return `${sanitizeBaseName(originalName)}-${variant}-${uniqueId}.webp`;
}

/**
 * Extracts the object path from a public URL of the `images` bucket.
 * Returns null for URLs that do not belong to it (e.g. legacy Vercel Blob).
 */
export function publicUrlToPath(url: string): string | null {
  let pathname: string;
  try {
    pathname = new URL(url).pathname;
  } catch {
    return null;
  }
  if (!pathname.startsWith(PUBLIC_PREFIX)) return null;
  try {
    const path = decodeURIComponent(pathname.slice(PUBLIC_PREFIX.length));
    return path || null;
  } catch {
    return null;
  }
}

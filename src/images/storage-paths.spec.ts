import {
  buildObjectKey,
  publicUrlToPath,
  sanitizeBaseName,
} from './storage-paths';

describe('storage-paths', () => {
  describe('sanitizeBaseName', () => {
    it('lowercases, strips accents and unsafe characters', () => {
      expect(sanitizeBaseName('Mi Foto Ñandú (1).JPG')).toBe('mi-foto-nandu-1');
    });

    it('falls back to "image" when nothing usable remains', () => {
      expect(sanitizeBaseName('日本語.png')).toBe('image');
    });

    it('limits the length', () => {
      expect(sanitizeBaseName(`${'a'.repeat(200)}.png`)).toHaveLength(60);
    });
  });

  it('builds a webp object key', () => {
    expect(buildObjectKey('Hello World.png', 'thumb', 'abc123')).toBe(
      'hello-world-thumb-abc123.webp',
    );
  });

  describe('publicUrlToPath', () => {
    const base = 'https://x.supabase.co/storage/v1/object/public/images/';

    it('extracts and decodes the path', () => {
      expect(publicUrlToPath(`${base}folder/a%20b.webp`)).toBe(
        'folder/a b.webp',
      );
    });

    it('returns null for foreign or invalid URLs', () => {
      expect(
        publicUrlToPath('https://abc.public.blob.vercel-storage.com/a.webp'),
      ).toBeNull();
      expect(
        publicUrlToPath(
          'https://x.supabase.co/storage/v1/object/public/other/a',
        ),
      ).toBeNull();
      expect(publicUrlToPath('not a url')).toBeNull();
      expect(publicUrlToPath(base)).toBeNull();
    });
  });
});

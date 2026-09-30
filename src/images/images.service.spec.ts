import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { DRIZZLE } from '../database/database.constants';
import { createMockDb, driverError } from '../database/mock-db.testing';
import sharp from 'sharp';
import { SupabaseService } from '../supabase/supabase.service';
import { ImagesService } from './images.service';

const image = (id: string) => ({
  id,
  filename: `${id}.jpg`,
  alt: 'alt',
  url_thumb: 't',
  url_medium: 'm',
  url_full: 'f',
  width: 10,
  height: 10,
  size_bytes: 100,
  created_at: '2024-01-01T00:00:00.000Z',
});

const PUBLIC = 'https://x.supabase.co/storage/v1/object/public/images/';

function createStorage() {
  return {
    upload: jest.fn().mockResolvedValue({ error: null }),
    remove: jest.fn().mockResolvedValue({ error: null }),
    getPublicUrl: jest.fn((path: string) => ({
      data: { publicUrl: `${PUBLIC}${path}` },
    })),
  };
}

async function build(...results: unknown[]) {
  const storage = createStorage();
  const module: TestingModule = await Test.createTestingModule({
    providers: [
      ImagesService,
      { provide: DRIZZLE, useValue: createMockDb(...results) },
      {
        provide: SupabaseService,
        useValue: {
          getClient: () => ({ storage: { from: () => storage } }),
        },
      },
    ],
  }).compile();
  return { service: module.get(ImagesService), storage };
}

describe('ImagesService', () => {
  describe('findAll', () => {
    it('returns [] when the collection slug does not exist', async () => {
      const { service } = await build([]);
      await expect(service.findAll('missing')).resolves.toEqual([]);
    });

    it('folds joined rows into one image with collectionIds', async () => {
      const { service } = await build([
        { image: image('i1'), collectionId: 'c1' },
        { image: image('i1'), collectionId: 'c2' },
        { image: image('i2'), collectionId: null },
      ]);

      const result = await service.findAll();

      expect(result).toEqual([
        { ...image('i1'), collectionIds: ['c1', 'c2'] },
        { ...image('i2'), collectionIds: [] },
      ]);
    });

    it('maps a query failure to BadRequestException', async () => {
      const { service } = await build(driverError('boom'));
      await expect(service.findAll()).rejects.toThrow(
        new BadRequestException('boom'),
      );
    });
  });

  describe('upload', () => {
    let file: Express.Multer.File;

    beforeAll(async () => {
      const buffer = await sharp({
        create: {
          width: 20,
          height: 10,
          channels: 3,
          background: '#fff',
        },
      })
        .png()
        .toBuffer();
      file = {
        buffer,
        originalname: 'Mi Foto.PNG',
        size: buffer.length,
      } as Express.Multer.File;
    });

    it('uploads three webp variants and stores their public URLs', async () => {
      const { service, storage } = await build([
        { ...image('i1'), url_thumb: 't', url_medium: 'm', url_full: 'f' },
      ]);

      await service.upload(file, 'alt');

      expect(storage.upload).toHaveBeenCalledTimes(3);
      const paths = storage.upload.mock.calls
        .map(([path]) => path as string)
        .sort();
      expect(paths[2]).toMatch(/^mi-foto-thumb-[0-9a-f]{8}\.webp$/);
      expect(paths[1]).toMatch(/^mi-foto-medium-[0-9a-f]{8}\.webp$/);
      expect(paths[0]).toMatch(/^mi-foto-full-[0-9a-f]{8}\.webp$/);
      expect(storage.upload).toHaveBeenCalledWith(
        paths[2],
        expect.any(Buffer),
        { contentType: 'image/webp', upsert: false },
      );
      expect(storage.remove).not.toHaveBeenCalled();
    });

    it('removes already uploaded variants when one upload fails', async () => {
      const { service, storage } = await build();
      storage.upload
        .mockResolvedValueOnce({ error: null })
        .mockResolvedValueOnce({ error: { message: 'bucket full' } })
        .mockResolvedValueOnce({ error: null });

      await expect(service.upload(file, 'alt')).rejects.toThrow(
        new BadRequestException('bucket full'),
      );

      expect(storage.remove).toHaveBeenCalledTimes(1);
      expect(storage.remove).toHaveBeenCalledWith([
        expect.any(String),
        expect.any(String),
      ]);
    });
  });

  describe('remove', () => {
    it('removes bucket objects and skips legacy blob URLs', async () => {
      const { service, storage } = await build(
        [
          {
            url_thumb: `${PUBLIC}a%20b-thumb.webp`,
            url_medium: 'https://abc.public.blob.vercel-storage.com/m.webp',
            url_full: `${PUBLIC}a%20b-full.webp`,
          },
        ],
        undefined,
      );

      await expect(service.remove('i1')).resolves.toEqual({ ok: true });
      expect(storage.remove).toHaveBeenCalledWith([
        'a b-thumb.webp',
        'a b-full.webp',
      ]);
    });

    it('does not call storage when every URL is legacy', async () => {
      const { service, storage } = await build(
        [
          {
            url_thumb: 'https://o/t',
            url_medium: 'https://o/m',
            url_full: 'https://o/f',
          },
        ],
        undefined,
      );

      await service.remove('i1');
      expect(storage.remove).not.toHaveBeenCalled();
    });

    it('throws NotFoundException when the image does not exist', async () => {
      const { service } = await build([]);
      await expect(service.remove('nope')).rejects.toThrow(
        new NotFoundException('Imagen no encontrada'),
      );
    });
  });

  describe('addToCollection', () => {
    it('is idempotent on unique violations (code on cause)', async () => {
      const { service } = await build(driverError('dup', '23505'));
      await expect(service.addToCollection('i1', 'c1')).resolves.toEqual({
        ok: true,
      });
    });

    it('is idempotent on unique violations (code on the error)', async () => {
      const { service } = await build(
        Object.assign(new Error('dup'), { code: '23505' }),
      );
      await expect(service.addToCollection('i1', 'c1')).resolves.toEqual({
        ok: true,
      });
    });

    it('rethrows other errors as BadRequestException', async () => {
      const { service } = await build(driverError('fk violation', '23503'));
      await expect(service.addToCollection('i1', 'c1')).rejects.toThrow(
        new BadRequestException('fk violation'),
      );
    });
  });

  it('removes an image from a collection', async () => {
    const { service } = await build(undefined);
    await expect(service.removeFromCollection('i1', 'c1')).resolves.toEqual({
      ok: true,
    });
  });
});

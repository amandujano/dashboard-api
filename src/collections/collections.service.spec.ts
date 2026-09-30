import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { DRIZZLE } from '../database/database.constants';
import { createMockDb, driverError } from '../database/mock-db.testing';
import { CollectionsService } from './collections.service';

const collection = {
  id: 'c1',
  name: 'Travel',
  slug: 'travel',
  created_at: '2024-01-01T00:00:00.000Z',
};

async function build(...results: unknown[]) {
  const module: TestingModule = await Test.createTestingModule({
    providers: [
      CollectionsService,
      { provide: DRIZZLE, useValue: createMockDb(...results) },
    ],
  }).compile();
  return module.get(CollectionsService);
}

describe('CollectionsService', () => {
  it('creates a collection', async () => {
    const service = await build([collection]);
    await expect(
      service.create({ name: 'Travel', slug: 'travel' }),
    ).resolves.toEqual(collection);
  });

  it('maps a create failure to BadRequestException', async () => {
    const service = await build(driverError('duplicate key', '23505'));
    await expect(
      service.create({ name: 'Travel', slug: 'travel' }),
    ).rejects.toThrow(new BadRequestException('duplicate key'));
  });

  it('lists collections', async () => {
    const service = await build([collection]);
    await expect(service.findAll()).resolves.toEqual([collection]);
  });

  it('removes a collection', async () => {
    const service = await build(undefined);
    await expect(service.remove('c1')).resolves.toEqual({ ok: true });
  });
});

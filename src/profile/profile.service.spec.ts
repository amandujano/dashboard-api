import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { DRIZZLE } from '../database/database.constants';
import { createMockDb } from '../database/mock-db.testing';
import { ProfileService } from './profile.service';

async function build(...results: unknown[]) {
  const module: TestingModule = await Test.createTestingModule({
    providers: [
      ProfileService,
      { provide: DRIZZLE, useValue: createMockDb(...results) },
    ],
  }).compile();
  return module.get(ProfileService);
}

describe('ProfileService', () => {
  it('returns name and bio', async () => {
    const service = await build([{ name: 'Angel', bio: 'Dev' }]);
    await expect(service.getProfile()).resolves.toEqual({
      name: 'Angel',
      bio: 'Dev',
    });
  });

  it('throws NotFoundException when there is no profile row', async () => {
    const service = await build([]);
    await expect(service.getProfile()).rejects.toThrow(NotFoundException);
  });
});

import { UnauthorizedException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { DRIZZLE } from '../database/database.constants';
import { createMockDb, driverError } from '../database/mock-db.testing';
import { ContactMessageService } from './contact-message.service';

async function build(...results: unknown[]) {
  const module: TestingModule = await Test.createTestingModule({
    providers: [
      ContactMessageService,
      { provide: DRIZZLE, useValue: createMockDb(...results) },
    ],
  }).compile();
  return module.get(ContactMessageService);
}

describe('ContactMessageService', () => {
  it('saves and returns the parsed message', async () => {
    const service = await build([
      {
        id: 1,
        name: 'Ann',
        email: 'ann@example.com',
        message: 'Hi',
        created_at: '2024-01-01T00:00:00.000Z',
        updated_at: '2024-01-01T00:00:00.000Z',
      },
    ]);

    const saved = await service.saveContactMessage(
      'Ann',
      'ann@example.com',
      'Hi',
    );

    expect(saved.id).toBe(1);
    expect(saved.created_at).toEqual(new Date('2024-01-01T00:00:00.000Z'));
  });

  it('throws UnauthorizedException when the insert fails', async () => {
    const service = await build(driverError('db down'));
    await expect(
      service.saveContactMessage('Ann', 'ann@example.com', 'Hi'),
    ).rejects.toThrow(new UnauthorizedException('db down'));
  });

  it('throws UnauthorizedException when no row is returned', async () => {
    const service = await build([]);
    await expect(
      service.saveContactMessage('Ann', 'ann@example.com', 'Hi'),
    ).rejects.toThrow(UnauthorizedException);
  });
});

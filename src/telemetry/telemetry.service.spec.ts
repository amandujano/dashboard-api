import { BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import geoip from 'geoip-lite';
import { DRIZZLE } from '../database/database.constants';
import { createMockDb, driverError } from '../database/mock-db.testing';
import { TelemetryService } from './telemetry.service';

jest.mock('geoip-lite', () => ({
  lookup: jest.fn(),
}));

const mockedGeoipLookup = geoip.lookup as jest.Mock;

async function build(...results: unknown[]) {
  const module: TestingModule = await Test.createTestingModule({
    providers: [
      TelemetryService,
      { provide: DRIZZLE, useValue: createMockDb(...results) },
      { provide: ConfigService, useValue: { get: () => 'salt' } },
    ],
  }).compile();
  return module.get(TelemetryService);
}

/** Like `build`, but captures the row passed to `db.insert(...).values(...)`. */
async function buildWithInsertSpy() {
  const values = jest.fn().mockResolvedValue(undefined);
  const db = { insert: jest.fn(() => ({ values })) };

  const module: TestingModule = await Test.createTestingModule({
    providers: [
      TelemetryService,
      { provide: DRIZZLE, useValue: db },
      { provide: ConfigService, useValue: { get: () => 'salt' } },
    ],
  }).compile();

  return { service: module.get<TelemetryService>(TelemetryService), values };
}

const rows = [
  {
    visitor_hash: 'aaaaaaaaaa',
    country: 'MX',
    browser: 'Chrome',
    created_at: '2024-01-02T10:00:00.000Z',
  },
  {
    visitor_hash: 'aaaaaaaaaa',
    country: 'MX',
    browser: 'Chrome',
    created_at: '2024-01-01T10:00:00.000Z',
  },
  {
    visitor_hash: 'bbbbbbbbbb',
    country: null,
    browser: 'Firefox',
    created_at: '2024-01-01T12:00:00.000Z',
  },
];

describe('TelemetryService', () => {
  beforeEach(() => {
    mockedGeoipLookup.mockReset();
  });

  it('records a visit', async () => {
    const service = await build(undefined);
    await expect(
      service.recordVisit({ ip: '1.1.1.1', path: '/' }),
    ).resolves.toEqual({ ok: true });
  });

  it('derives the country from the geoip lookup of the given IP', async () => {
    mockedGeoipLookup.mockReturnValue({ country: 'MX' });
    const { service, values } = await buildWithInsertSpy();

    await service.recordVisit({ ip: '1.2.3.4', path: '/' });

    expect(mockedGeoipLookup).toHaveBeenCalledWith('1.2.3.4');
    expect(values).toHaveBeenCalledWith(
      expect.objectContaining({ country: 'MX' }),
    );
  });

  it('persists no country when the IP cannot be resolved', async () => {
    mockedGeoipLookup.mockReturnValue(null);
    const { service, values } = await buildWithInsertSpy();

    await expect(
      service.recordVisit({ ip: 'unknown', path: '/' }),
    ).resolves.toEqual({ ok: true });
    expect(values).toHaveBeenCalledWith(
      expect.objectContaining({ country: null }),
    );
  });

  it('maps an insert failure to BadRequestException', async () => {
    const service = await build(driverError('nope'));
    await expect(
      service.recordVisit({ ip: '1.1.1.1', path: '/' }),
    ).rejects.toThrow(new BadRequestException('nope'));
  });

  it('aggregates stats', async () => {
    const service = await build(rows);
    const stats = await service.getStats();

    expect(stats.totalVisits).toBe(3);
    expect(stats.uniqueVisitors).toBe(2);
    expect(stats.byCountry).toEqual([
      { name: 'MX', count: 2 },
      { name: 'unknown', count: 1 },
    ]);
    expect(stats.byDay).toEqual([
      { date: '2024-01-01', count: 2 },
      { date: '2024-01-02', count: 1 },
    ]);
  });

  it('groups visitors and sorts by visits', async () => {
    const service = await build(rows);
    const visitors = await service.getVisitors();

    expect(visitors).toHaveLength(2);
    expect(visitors[0]).toMatchObject({
      id: 'aaaaaaaa',
      visits: 2,
      firstSeen: '2024-01-01T10:00:00.000Z',
      lastSeen: '2024-01-02T10:00:00.000Z',
    });
  });
});

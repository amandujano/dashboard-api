import { Test, TestingModule } from '@nestjs/testing';
import type { Request } from 'express';
import { TelemetryController } from './telemetry.controller';
import { TelemetryService } from './telemetry.service';

describe('TelemetryController', () => {
  let controller: TelemetryController;
  const service = {
    recordVisit: jest.fn(),
    getStats: jest.fn(),
    getVisitors: jest.fn(),
  };

  const req = (headers: Record<string, string | string[]>) =>
    ({ headers }) as unknown as Request;

  beforeEach(async () => {
    jest.resetAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [TelemetryController],
      providers: [{ provide: TelemetryService, useValue: service }],
    }).compile();

    controller = module.get<TelemetryController>(TelemetryController);
  });

  it('record uses the first forwarded IP and request metadata', async () => {
    service.recordVisit.mockResolvedValue({ ok: true });

    const result = await controller.record(
      req({
        'x-forwarded-for': '1.1.1.1, 2.2.2.2',
        'x-vercel-ip-country': 'MX',
        'user-agent': 'jest',
      }),
      { path: '/blog' },
    );

    expect(service.recordVisit).toHaveBeenCalledWith({
      ip: '1.1.1.1',
      path: '/blog',
      country: 'MX',
      userAgent: 'jest',
    });
    expect(result).toEqual({ ok: true });
  });

  it('record falls back to unknown IP and root path', async () => {
    await controller.record(req({}), {});

    expect(service.recordVisit).toHaveBeenCalledWith({
      ip: 'unknown',
      path: '/',
      country: undefined,
      userAgent: undefined,
    });
  });

  it('stats delegates to getStats', async () => {
    service.getStats.mockResolvedValue({ total: 1 });

    await expect(controller.stats()).resolves.toEqual({ total: 1 });
  });

  it('visitors delegates to getVisitors', async () => {
    service.getVisitors.mockResolvedValue([]);

    await expect(controller.visitors()).resolves.toEqual([]);
  });
});

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

  const req = (ip: string | undefined, headers: Record<string, string> = {}) =>
    ({ ip, headers }) as unknown as Request;

  beforeEach(async () => {
    jest.resetAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [TelemetryController],
      providers: [{ provide: TelemetryService, useValue: service }],
    }).compile();

    controller = module.get<TelemetryController>(TelemetryController);
  });

  it('record uses the trust-proxy-resolved IP and request metadata', async () => {
    service.recordVisit.mockResolvedValue({ ok: true });

    const result = await controller.record(
      req('1.1.1.1', { 'user-agent': 'jest' }),
      { path: '/blog' },
    );

    expect(service.recordVisit).toHaveBeenCalledWith({
      ip: '1.1.1.1',
      path: '/blog',
      userAgent: 'jest',
    });
    expect(result).toEqual({ ok: true });
  });

  it('record falls back to unknown IP and root path', async () => {
    await controller.record(req(undefined), {});

    expect(service.recordVisit).toHaveBeenCalledWith({
      ip: 'unknown',
      path: '/',
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

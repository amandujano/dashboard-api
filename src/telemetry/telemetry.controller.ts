import { Body, Controller, Get, Post, Req } from '@nestjs/common';
import type { Request } from 'express';
import { Public } from '../auth/public.decorator';
import { TelemetryService } from './telemetry.service';

@Controller('api/telemetry')
export class TelemetryController {
  constructor(private telemetryService: TelemetryService) {}

  @Public()
  @Post()
  async record(@Req() req: Request, @Body() body: { path?: string }) {
    // req.ip is Express's trust-proxy-aware resolved client IP — it walks the
    // forwarded chain from the trusted side, unlike a raw x-forwarded-for
    // header (which a client's own request can spoof).
    const ip = req.ip ?? 'unknown';

    return this.telemetryService.recordVisit({
      ip,
      path: body.path ?? '/',
      userAgent: req.headers['user-agent'],
    });
  }

  @Get('stats')
  async stats() {
    return this.telemetryService.getStats();
  }

  @Get('visitors')
  async visitors() {
    return this.telemetryService.getVisitors();
  }
}

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
    const forwarded = req.headers['x-forwarded-for'];
    const ip =
      (Array.isArray(forwarded) ? forwarded[0] : forwarded)
        ?.split(',')[0]
        ?.trim() ?? 'unknown';

    return this.telemetryService.recordVisit({
      ip,
      path: body.path ?? '/',
      country: req.headers['x-vercel-ip-country'] as string | undefined,
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

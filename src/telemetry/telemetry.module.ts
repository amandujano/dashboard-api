import { Module } from '@nestjs/common';
import { TelemetryService } from './telemetry.service';
import { TelemetryController } from './telemetry.controller';

@Module({
  providers: [TelemetryService],
  controllers: [TelemetryController],
})
export class TelemetryModule {}

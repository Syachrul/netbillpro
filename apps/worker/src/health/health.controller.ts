import { Controller, Get } from '@nestjs/common';

@Controller('health')
export class HealthController {
  @Get()
  check(): { status: 'ok'; role: 'worker'; timestamp: string } {
    return { status: 'ok', role: 'worker', timestamp: new Date().toISOString() };
  }
}

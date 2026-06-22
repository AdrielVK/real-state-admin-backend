import { Controller, Get } from '@nestjs/common';

@Controller('users')
export class UsersController {
  @Get('health')
  health(): { status: string } {
    return { status: 'ok' };
  }
}

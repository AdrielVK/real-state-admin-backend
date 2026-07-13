import { Body, Controller, HttpCode, Post } from '@nestjs/common';

import { Public } from '@shared/presentation';

import {
  LoginCommand,
  LoginHandler,
  type LoginResult,
} from '../../application/commands/login.handler';
import { LogoutCommand, LogoutHandler } from '../../application/commands/logout.handler';
import { RefreshCommand, RefreshHandler } from '../../application/commands/refresh.handler';
import { LoginDto } from '../../application/dto/login.dto';
import { LogoutDto } from '../../application/dto/logout.dto';
import { RefreshDto } from '../../application/dto/refresh.dto';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly loginHandler: LoginHandler,
    private readonly refreshHandler: RefreshHandler,
    private readonly logoutHandler: LogoutHandler,
  ) {}

  @Public()
  @Post('login')
  @HttpCode(200)
  async login(@Body() dto: LoginDto): Promise<LoginResult> {
    return this.loginHandler.execute(new LoginCommand(dto.email, dto.password));
  }

  @Public()
  @Post('refresh')
  @HttpCode(200)
  async refresh(@Body() dto: RefreshDto): Promise<LoginResult> {
    return this.refreshHandler.execute(new RefreshCommand(dto.refreshToken));
  }

  @Post('logout')
  @HttpCode(200)
  async logout(@Body() dto: LogoutDto): Promise<{ success: boolean }> {
    await this.logoutHandler.execute(new LogoutCommand(dto.refreshToken));
    return { success: true };
  }
}

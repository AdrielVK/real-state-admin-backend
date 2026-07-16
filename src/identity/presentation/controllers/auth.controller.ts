import { Body, Controller, HttpCode, Post } from '@nestjs/common';

import { Public } from '@shared/presentation';

import {
  LoginCommand,
  type LoginResult,
  LoginUseCase,
} from '../../application/commands/login.use-case';
import { LogoutCommand, LogoutUseCase } from '../../application/commands/logout.use-case';
import { RefreshCommand, RefreshUseCase } from '../../application/commands/refresh.use-case';
import { LoginDto } from '../../application/dto/login.dto';
import { LogoutDto } from '../../application/dto/logout.dto';
import { RefreshDto } from '../../application/dto/refresh.dto';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly loginUseCase: LoginUseCase,
    private readonly refreshUseCase: RefreshUseCase,
    private readonly logoutUseCase: LogoutUseCase,
  ) {}

  @Public()
  @Post('login')
  @HttpCode(200)
  async login(@Body() dto: LoginDto): Promise<LoginResult> {
    return this.loginUseCase.execute(new LoginCommand(dto.email, dto.password));
  }

  @Public()
  @Post('refresh')
  @HttpCode(200)
  async refresh(@Body() dto: RefreshDto): Promise<LoginResult> {
    return this.refreshUseCase.execute(new RefreshCommand(dto.refreshToken));
  }

  @Post('logout')
  @HttpCode(200)
  async logout(@Body() dto: LogoutDto): Promise<{ success: boolean }> {
    await this.logoutUseCase.execute(new LogoutCommand(dto.refreshToken));
    return { success: true };
  }
}

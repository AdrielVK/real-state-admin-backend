import { Body, Controller, HttpCode, Post } from '@nestjs/common';

import { UserRole } from '@shared/domain';
import { Roles } from '@shared/presentation';

import { CreateBusinessUserCommand } from '../../application/commands/create-business-user.command';
import { CreateBusinessUserUseCase } from '../../application/commands/create-business-user.use-case';
import { CreateBusinessUserDto } from '../../application/dto/create-business-user.dto';

@Controller('profiles')
export class ProfilesController {
  constructor(private readonly useCase: CreateBusinessUserUseCase) {}

  @Roles(UserRole.ADMIN)
  @Post('business-users')
  @HttpCode(201)
  async create(@Body() dto: CreateBusinessUserDto): Promise<Record<string, unknown>> {
    const user = await this.useCase.execute(new CreateBusinessUserCommand(dto));
    return user.toPrimitives();
  }
}

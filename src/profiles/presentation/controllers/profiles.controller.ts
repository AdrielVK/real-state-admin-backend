import { Body, Controller, HttpCode, Post } from '@nestjs/common';

import { UserRole } from '@shared/domain';
import { Roles } from '@shared/presentation';

import { CreateBusinessUserHandler } from '../../application/commands/create-business-user.handler';
import { CreateBusinessUserDto } from '../../application/dto/create-business-user.dto';

@Controller('profiles')
export class ProfilesController {
  constructor(private readonly handler: CreateBusinessUserHandler) {}

  @Roles(UserRole.ADMIN)
  @Post('business-users')
  @HttpCode(201)
  async create(@Body() dto: CreateBusinessUserDto): Promise<Record<string, unknown>> {
    const user = await this.handler.execute(dto);
    return user.toPrimitives();
  }
}

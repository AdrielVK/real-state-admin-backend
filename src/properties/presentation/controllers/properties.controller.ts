import { Body, Controller, HttpCode, Post } from '@nestjs/common';

import { UserRole } from '@shared/domain';
import { Roles } from '@shared/presentation';

import {
  CreatePropertyDto,
  CreatePropertyHandler,
  type CreatePropertyResult,
} from '../../application';

@Controller('properties')
export class PropertiesController {
  constructor(private readonly handler: CreatePropertyHandler) {}

  @Roles(UserRole.ADMIN, UserRole.AGENT)
  @Post()
  @HttpCode(201)
  async create(@Body() dto: CreatePropertyDto): Promise<CreatePropertyResult> {
    return this.handler.execute(dto);
  }
}

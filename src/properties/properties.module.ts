import { Module } from '@nestjs/common';

import { CreatePropertyHandler } from './application/commands/create-property.handler';
import {
  IPlaceResolverToken,
  IPropertyInternalIdGeneratorToken,
  IPropertyRepositoryToken,
} from './domain';
import {
  MockPlaceResolver,
  PrismaPropertyRepository,
  RandomPropertyInternalIdGenerator,
} from './infrastructure';
import { PropertiesController } from './presentation/controllers/properties.controller';

@Module({
  providers: [
    {
      provide: IPropertyRepositoryToken,
      useClass: PrismaPropertyRepository,
    },
    {
      provide: IPlaceResolverToken,
      useClass: MockPlaceResolver,
    },
    {
      provide: IPropertyInternalIdGeneratorToken,
      useClass: RandomPropertyInternalIdGenerator,
    },
    RandomPropertyInternalIdGenerator,
    MockPlaceResolver,
    PrismaPropertyRepository,
    CreatePropertyHandler,
  ],
  controllers: [PropertiesController],
  exports: [IPropertyRepositoryToken, IPlaceResolverToken, IPropertyInternalIdGeneratorToken],
})
export class PropertiesModule {}

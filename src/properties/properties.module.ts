import { Module } from '@nestjs/common';

import { DomainEventModule } from '@shared/infrastructure';

import { CreatePropertyUseCase } from './application/commands/create-property.use-case';
import { DeletePropertyUseCase } from './application/commands/delete-property.use-case';
import { GetPropertyByIdUseCase } from './application/queries/get-property-by-id.use-case';
import { IProfileExistenceServiceToken, IPropertyRepositoryToken } from './domain';
import { PrismaPropertyRepository } from './infrastructure/repositories/prisma-property.repository';
import { PrismaProfileExistenceService } from './infrastructure/services/prisma-profile-existence.service';
import { PropertiesController } from './presentation/controllers/properties.controller';

@Module({
  imports: [DomainEventModule],
  providers: [
    {
      provide: IPropertyRepositoryToken,
      useClass: PrismaPropertyRepository,
    },
    {
      provide: IProfileExistenceServiceToken,
      useClass: PrismaProfileExistenceService,
    },
    CreatePropertyUseCase,
    DeletePropertyUseCase,
    GetPropertyByIdUseCase,
  ],
  controllers: [PropertiesController],
  exports: [IPropertyRepositoryToken],
})
export class PropertiesModule {}

import { Module } from '@nestjs/common';

import { DomainEventModule } from '@shared/infrastructure';

import { CreatePropertyUseCase } from './application/commands/create-property.use-case';
import { DeletePropertyUseCase } from './application/commands/delete-property.use-case';
import { EditPropertyAddressUseCase } from './application/commands/edit-property-address.use-case';
import { EditPropertyCharacteristicsUseCase } from './application/commands/edit-property-characteristics.use-case';
import { EditPropertyStatusUseCase } from './application/commands/edit-property-status.use-case';
import { GetPropertyByIdUseCase } from './application/queries/get-property-by-id.use-case';
import { ListAllPropertiesUseCase } from './application/queries/list-all-properties.use-case';
import { ListMyPropertiesUseCase } from './application/queries/list-my-properties.use-case';
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
    EditPropertyAddressUseCase,
    EditPropertyCharacteristicsUseCase,
    EditPropertyStatusUseCase,
    GetPropertyByIdUseCase,
    ListAllPropertiesUseCase,
    ListMyPropertiesUseCase,
  ],
  controllers: [PropertiesController],
  exports: [IPropertyRepositoryToken],
})
export class PropertiesModule {}

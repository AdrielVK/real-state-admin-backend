import { Inject, Injectable } from '@nestjs/common';

import { ErrorCode, type IQuery, type IQueryHandler } from '@shared/domain';
import { AppException } from '@shared/presentation';

import {
  type IPropertyRepository,
  IPropertyRepositoryToken,
  Property,
  PropertyId,
} from '../../domain';

export class GetPropertyByIdQuery implements IQuery<Property> {
  readonly _resultType?: Property;

  constructor(readonly id: string) {}
}

@Injectable()
export class GetPropertyByIdUseCase implements IQueryHandler<GetPropertyByIdQuery, Property> {
  constructor(
    @Inject(IPropertyRepositoryToken) private readonly propertyRepository: IPropertyRepository,
  ) {}

  async execute(query: GetPropertyByIdQuery): Promise<Property> {
    const property = await this.propertyRepository.findById(new PropertyId(query.id));
    if (!property) {
      throw new AppException(ErrorCode.NOT_FOUND, `Property with id "${query.id}" not found`);
    }
    return property;
  }
}

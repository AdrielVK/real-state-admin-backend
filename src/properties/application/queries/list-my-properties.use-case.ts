import { Inject, Injectable } from '@nestjs/common';

import type { IQuery, IQueryHandler } from '@shared/domain';

import { type IPropertyRepository, IPropertyRepositoryToken } from '../../domain';
import type { PaginatedPropertiesResult } from './list-all-properties.use-case';

export class ListMyPropertiesQuery implements IQuery<PaginatedPropertiesResult> {
  readonly _resultType?: PaginatedPropertiesResult;

  constructor(
    readonly createdByUserId: string,
    readonly page: number,
    readonly limit: number,
  ) {}
}

@Injectable()
export class ListMyPropertiesUseCase implements IQueryHandler<
  ListMyPropertiesQuery,
  PaginatedPropertiesResult
> {
  constructor(
    @Inject(IPropertyRepositoryToken) private readonly propertyRepository: IPropertyRepository,
  ) {}

  async execute(query: ListMyPropertiesQuery): Promise<PaginatedPropertiesResult> {
    const { createdByUserId, page, limit } = query;

    const [properties, total] = await Promise.all([
      this.propertyRepository.findMany({ createdByUserId, page, limit }),
      this.propertyRepository.count({ createdByUserId }),
    ]);

    return {
      data: properties,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}

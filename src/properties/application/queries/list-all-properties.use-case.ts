import { Inject, Injectable } from '@nestjs/common';

import type { IQuery, IQueryHandler } from '@shared/domain';
import type { PaginationMeta } from '@shared/presentation';

import { type IPropertyRepository, IPropertyRepositoryToken } from '../../domain';
import type { Property } from '../../domain/entities/property.aggregate';

export interface PaginatedPropertiesResult {
  data: Property[];
  meta: PaginationMeta;
}

export class ListAllPropertiesQuery implements IQuery<PaginatedPropertiesResult> {
  readonly _resultType?: PaginatedPropertiesResult;

  constructor(
    readonly page: number,
    readonly limit: number,
  ) {}
}

@Injectable()
export class ListAllPropertiesUseCase implements IQueryHandler<
  ListAllPropertiesQuery,
  PaginatedPropertiesResult
> {
  constructor(
    @Inject(IPropertyRepositoryToken) private readonly propertyRepository: IPropertyRepository,
  ) {}

  async execute(query: ListAllPropertiesQuery): Promise<PaginatedPropertiesResult> {
    const { page, limit } = query;

    const [properties, total] = await Promise.all([
      this.propertyRepository.findMany({ page, limit }),
      this.propertyRepository.count({}),
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

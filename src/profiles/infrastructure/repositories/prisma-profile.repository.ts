import { Injectable } from '@nestjs/common';

import { PrismaService } from '@shared/infrastructure';

import type { Profile } from '../../domain/entities/profile.aggregate';
import type { IProfileRepository } from '../../domain/repositories/profile-repository.interface';
import type { ProfileId } from '../../domain/value-objects/profile-id.value-object';
import { PrismaProfileMapper } from '../mappers/prisma-profile.mapper';

@Injectable()
export class PrismaProfileRepository implements IProfileRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByUserId(userId: string): Promise<Profile<ProfileId> | null> {
    const prismaProfile = await this.prisma.profile.findUnique({
      where: { userId },
    });
    return prismaProfile ? PrismaProfileMapper.toDomain(prismaProfile) : null;
  }

  async save(profile: Profile<ProfileId>): Promise<Profile<ProfileId>> {
    const data = PrismaProfileMapper.toPrisma(profile);
    await this.prisma.profile.upsert({
      where: { id: data.id },
      create: {
        id: data.id,
        userId: data.userId,
        role: data.role,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
      },
      update: {
        userId: data.userId,
        role: data.role,
        updatedAt: data.updatedAt,
      },
    });
    profile.pullDomainEvents();
    return profile;
  }
}

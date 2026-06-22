import { Injectable } from '@nestjs/common';

import { PrismaService } from '@shared/infrastructure';

import { User } from '../../domain/entities/user.entity';
import type { IUserRepository } from '../../domain/repositories/user-repository.interface';
import { UserEmail } from '../../domain/value-objects/user-email.value-object';
import { UserId } from '../../domain/value-objects/user-id.value-object';
import { PrismaUserMapper } from '../mappers/prisma-user.mapper';

@Injectable()
export class PrismaUserRepository implements IUserRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: UserId): Promise<User | null> {
    const prismaUser = await this.prisma.user.findUnique({
      where: { id: id.toValue() },
    });
    return prismaUser ? PrismaUserMapper.toDomain(prismaUser) : null;
  }

  async findByEmail(email: UserEmail): Promise<User | null> {
    const prismaUser = await this.prisma.user.findUnique({
      where: { email: email.value },
    });
    return prismaUser ? PrismaUserMapper.toDomain(prismaUser) : null;
  }

  async save(user: User): Promise<User> {
    const data = PrismaUserMapper.toPrisma(user);
    const prismaUser = await this.prisma.user.upsert({
      where: { id: data.id },
      update: {
        email: data.email,
        passwordHash: data.passwordHash,
        firstName: data.firstName,
        lastName: data.lastName,
        role: data.role,
      },
      create: data,
    });
    return PrismaUserMapper.toDomain(prismaUser);
  }

  async delete(id: UserId): Promise<void> {
    await this.prisma.user.delete({
      where: { id: id.toValue() },
    });
  }
}

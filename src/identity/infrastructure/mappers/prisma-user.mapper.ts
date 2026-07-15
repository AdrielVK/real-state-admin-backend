import type { UserRole } from '@shared/domain/value-objects/user-role.enum';

import type { UserModel } from '../../../generated/prisma/models';
import { User } from '../../domain/entities/user.aggregate';
import type { UserStatus } from '../../domain/enums/user-status.enum';
import { UserEmail } from '../../domain/value-objects/user-email.value-object';
import { UserId } from '../../domain/value-objects/user-id.value-object';

export const PrismaUserMapper = {
  toDomain(prismaUser: UserModel): User {
    return User.reconstitute(
      new UserId(prismaUser.id),
      new UserEmail(prismaUser.email),
      prismaUser.passwordHash,
      prismaUser.firstName,
      prismaUser.lastName,
      prismaUser.role as UserRole,
      prismaUser.status as UserStatus,
      prismaUser.createdAt,
      prismaUser.updatedAt,
    );
  },

  toPrisma(user: User): {
    id: string;
    email: string;
    passwordHash: string;
    firstName: string;
    lastName: string;
    role: UserRole;
    status: UserStatus;
  } {
    return {
      id: user.id.toValue(),
      email: user.email.value,
      passwordHash: user.passwordHash,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      status: user.status,
    };
  },
};

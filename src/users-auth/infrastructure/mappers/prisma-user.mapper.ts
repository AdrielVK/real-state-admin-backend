import type { UserModel } from '../../../generated/prisma/models';
import { User } from '../../domain/entities/user.entity';
import type { UserRole } from '../../domain/enums/user-role.enum';
import { UserEmail } from '../../domain/value-objects/user-email.value-object';
import { UserId } from '../../domain/value-objects/user-id.value-object';

export const PrismaUserMapper = {
  toDomain(prismaUser: UserModel): User {
    return User.create({
      id: new UserId(prismaUser.id),
      email: new UserEmail(prismaUser.email),
      firstName: prismaUser.firstName,
      lastName: prismaUser.lastName,
      role: prismaUser.role as UserRole,
      passwordHash: prismaUser.passwordHash,
      createdAt: prismaUser.createdAt,
      updatedAt: prismaUser.updatedAt,
    });
  },

  toPrisma(user: User): {
    id: string;
    email: string;
    passwordHash: string;
    firstName: string;
    lastName: string;
    role: UserRole;
  } {
    return {
      id: user.id.toValue(),
      email: user.email.value,
      passwordHash: user.passwordHash,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
    };
  },
};

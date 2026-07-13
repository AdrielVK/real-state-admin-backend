import { IsEmail, IsEnum, IsString } from 'class-validator';

import { UserRole } from '@shared/domain';

export class CreateBusinessUserDto {
  @IsEmail()
  email!: string;

  @IsString()
  firstName!: string;

  @IsString()
  lastName!: string;

  @IsString()
  password!: string;

  @IsEnum([UserRole.AGENT, UserRole.ADMINISTRATIVE], {
    message: 'El rol debe ser AGENT o ADMINISTRATIVE',
  })
  role!: UserRole;
}

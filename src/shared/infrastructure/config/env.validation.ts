import { plainToInstance } from 'class-transformer';
import { IsEnum, IsNumber, IsOptional, IsString, validateSync } from 'class-validator';

enum NodeEnv {
  Development = 'development',
  Production = 'production',
  Test = 'test',
}

export class EnvironmentVariables {
  @IsString()
  DATABASE_URL!: string;

  @IsString()
  JWT_SECRET!: string;

  @IsString()
  JWT_EXPIRATION!: string;

  @IsOptional()
  @IsNumber()
  PORT?: number;

  @IsEnum(NodeEnv)
  NODE_ENV!: NodeEnv;
}

export function validate(env: Record<string, unknown>): EnvironmentVariables {
  const validated = plainToInstance(EnvironmentVariables, env, {
    enableImplicitConversion: true,
  });

  // Apply defaults
  validated.PORT ??= 3000;

  const errors = validateSync(validated, { skipMissingProperties: false });

  if (errors.length > 0) {
    throw new Error(errors.toString());
  }

  return validated;
}

import { defineConfig, env } from 'prisma/config';

interface EnvVars {
  DATABASE_URL: string;
}

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
  },
  datasource: {
    url: env<EnvVars>('DATABASE_URL'),
  },
});

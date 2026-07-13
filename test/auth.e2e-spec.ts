import { randomUUID } from 'node:crypto';

import type { INestApplication } from '@nestjs/common';
import { type OnModuleDestroy, type OnModuleInit, ValidationPipe } from '@nestjs/common';
import { Test, type TestingModule } from '@nestjs/testing';

import request from 'supertest';

import { PrismaService } from '@shared/infrastructure';
import { GlobalExceptionFilter, ResponseEnvelopeInterceptor } from '@shared/presentation';
import { PlainPassword, UserEmail } from '@identity/domain';
import { BcryptPasswordHasher } from '@identity/infrastructure';

import { AppModule } from '../src/app.module';

// In-memory stand-in for PrismaService. The configured DATABASE_URL points to a
// private IP that is not reachable from the test sandbox, and the PrismaClient
// referenced by PrismaService is replaced by the Jest moduleNameMapper mock at
// test/__mocks__/prisma-client.ts. To make the auth E2E flow exercisable, we
// override PrismaService with this class, which keeps records in memory and
// implements the same shape PrismaService exposes (user + refreshToken delegates
// + lifecycle hooks).
class InMemoryPrismaService implements OnModuleInit, OnModuleDestroy {
  private readonly users = new Map<
    string,
    {
      id: string;
      email: string;
      passwordHash: string;
      firstName: string;
      lastName: string;
      role: string;
      createdAt: Date;
      updatedAt: Date;
    }
  >();
  private readonly refreshTokens = new Map<
    string,
    {
      id: string;
      userId: string;
      tokenHash: string;
      expiresAt: Date;
      revokedAt: Date | null;
      createdAt: Date;
    }
  >();

  async onModuleInit(): Promise<void> {
    /* no-op */
  }

  async onModuleDestroy(): Promise<void> {
    /* no-op */
  }

  user = {
    findUnique: async ({
      where,
    }: {
      where: { id?: string; email?: string };
    }): Promise<InMemoryPrismaService['users'] extends Map<string, infer V> ? V | null : never> => {
      if (where.id) {
        return (this.users.get(where.id) ?? null) as never;
      }
      if (where.email) {
        for (const user of this.users.values()) {
          if (user.email === where.email) {
            return user as never;
          }
        }
        return null as never;
      }
      return null as never;
    },
    create: async ({
      data,
    }: {
      data: {
        id?: string;
        email: string;
        passwordHash: string;
        firstName: string;
        lastName: string;
        role: string;
      };
    }) => {
      const user = {
        id: data.id ?? randomUUID(),
        email: data.email,
        passwordHash: data.passwordHash,
        firstName: data.firstName,
        lastName: data.lastName,
        role: data.role,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      this.users.set(user.id, user);
      return user;
    },
    deleteMany: async () => {
      const count = this.users.size;
      this.users.clear();
      return { count };
    },
  };

  refreshToken = {
    create: async ({
      data,
    }: {
      data: {
        id: string;
        userId: string;
        tokenHash: string;
        expiresAt: Date;
        revokedAt: Date | null;
        createdAt: Date;
      };
    }) => {
      const token = { ...data };
      this.refreshTokens.set(token.id, token);
      return token;
    },
    findUnique: async ({ where }: { where: { id?: string; tokenHash?: string } }) => {
      if (where.id) {
        return this.refreshTokens.get(where.id) ?? null;
      }
      if (where.tokenHash) {
        for (const token of this.refreshTokens.values()) {
          if (token.tokenHash === where.tokenHash) {
            return token;
          }
        }
        return null;
      }
      return null;
    },
    update: async ({ where, data }: { where: { id: string }; data: { revokedAt: Date } }) => {
      const token = this.refreshTokens.get(where.id);
      if (token) {
        token.revokedAt = data.revokedAt;
      }
      return token;
    },
    deleteMany: async () => {
      const count = this.refreshTokens.size;
      this.refreshTokens.clear();
      return { count };
    },
  };
}

describe('Auth (e2e)', () => {
  let app: INestApplication;
  let prisma: InMemoryPrismaService;
  let hasher: BcryptPasswordHasher;
  let testUserId: string;
  const testUserEmail = 'e2e-auth@example.com';
  const testUserPassword = 'TestPassword1!';

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PrismaService)
      .useClass(InMemoryPrismaService)
      .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    app.useGlobalFilters(new GlobalExceptionFilter());
    app.useGlobalInterceptors(new ResponseEnvelopeInterceptor());
    await app.init();

    prisma = app.get(PrismaService) as InMemoryPrismaService;
    hasher = app.get(BcryptPasswordHasher);

    const passwordHash = await hasher.hash(PlainPassword.create(testUserPassword));
    const created = await prisma.user.create({
      data: {
        id: randomUUID(),
        email: testUserEmail,
        passwordHash,
        firstName: 'E2E',
        lastName: 'Auth',
        role: 'CLIENT',
      },
    });
    testUserId = created.id;

    // Sanity check: domain value objects must accept the email used in tests.
    new UserEmail(testUserEmail);
  });

  afterAll(async () => {
    await prisma.refreshToken.deleteMany();
    await prisma.user.deleteMany();
    await app.close();
  });

  it('1. POST /auth/login with valid credentials returns 200 + tokens + user', async () => {
    const res = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: testUserEmail, password: testUserPassword })
      .expect(200);

    expect(res.body).toEqual({
      success: true,
      data: {
        accessToken: expect.any(String),
        refreshToken: expect.any(String),
        user: {
          id: testUserId,
          email: testUserEmail,
          role: 'CLIENT',
        },
      },
    });
  });

  it('2. POST /auth/login with wrong password returns 401', async () => {
    const res = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: testUserEmail, password: 'WrongPassword1!' })
      .expect(401);

    expect(res.body.success).toBe(false);
    expect(res.body.error).toMatchObject({
      code: 'UNAUTHORIZED',
      message: 'Credenciales inválidas',
    });
  });

  it('3. POST /auth/login with unknown email returns 401', async () => {
    const res = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'nobody@example.com', password: 'TestPassword1!' })
      .expect(401);

    expect(res.body.success).toBe(false);
    expect(res.body.error).toMatchObject({
      code: 'UNAUTHORIZED',
      message: 'Credenciales inválidas',
    });
  });

  it('4. POST /auth/refresh with a valid token returns 200 and a new pair', async () => {
    const login = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: testUserEmail, password: testUserPassword })
      .expect(200);

    const oldRefreshToken = login.body.data.refreshToken as string;

    const res = await request(app.getHttpServer())
      .post('/auth/refresh')
      .send({ refreshToken: oldRefreshToken })
      .expect(200);

    expect(res.body.data.accessToken).toEqual(expect.any(String));
    expect(res.body.data.refreshToken).toEqual(expect.any(String));
    expect(res.body.data.refreshToken).not.toEqual(oldRefreshToken);
    expect(res.body.data.user).toEqual({
      id: testUserId,
      email: testUserEmail,
      role: 'CLIENT',
    });
  });

  it('5. POST /auth/refresh with an unknown token returns 401', async () => {
    const res = await request(app.getHttpServer())
      .post('/auth/refresh')
      .send({ refreshToken: 'definitely-not-a-real-token' })
      .expect(401);

    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('UNAUTHORIZED');
  });

  it('6. POST /auth/logout with a valid refresh token and access token returns 200', async () => {
    const login = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: testUserEmail, password: testUserPassword })
      .expect(200);

    const accessToken = login.body.data.accessToken as string;
    const refreshToken = login.body.data.refreshToken as string;

    const res = await request(app.getHttpServer())
      .post('/auth/logout')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ refreshToken })
      .expect(200);

    expect(res.body.success).toBe(true);
  });

  it('7. POST /auth/refresh with a revoked token (after logout) returns 401', async () => {
    const login = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: testUserEmail, password: testUserPassword })
      .expect(200);

    const accessToken = login.body.data.accessToken as string;
    const refreshToken = login.body.data.refreshToken as string;

    await request(app.getHttpServer())
      .post('/auth/logout')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ refreshToken })
      .expect(200);

    const res = await request(app.getHttpServer())
      .post('/auth/refresh')
      .send({ refreshToken })
      .expect(401);

    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('UNAUTHORIZED');
  });

  it('8. Protected route without a token returns 401', async () => {
    const res = await request(app.getHttpServer())
      .post('/auth/logout')
      .send({ refreshToken: 'irrelevant' })
      .expect(401);

    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('UNAUTHORIZED');
  });

  it('9. GET /health without a token returns 200 (@Public)', async () => {
    const res = await request(app.getHttpServer()).get('/health').expect(200);

    expect(res.body).toEqual({
      success: true,
      data: { status: 'ok' },
    });
  });

  it('10. Protected route with a valid access token returns 200', async () => {
    const login = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: testUserEmail, password: testUserPassword })
      .expect(200);

    const accessToken = login.body.data.accessToken as string;
    const refreshToken = login.body.data.refreshToken as string;

    const res = await request(app.getHttpServer())
      .post('/auth/logout')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ refreshToken })
      .expect(200);

    expect(res.body.success).toBe(true);
  });
});

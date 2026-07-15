import { randomUUID } from 'node:crypto';

import type { INestApplication } from '@nestjs/common';
import { type OnModuleDestroy, type OnModuleInit, ValidationPipe } from '@nestjs/common';
import { Test, type TestingModule } from '@nestjs/testing';

import request from 'supertest';

import { PrismaService } from '@shared/infrastructure';
import { GlobalExceptionFilter, ResponseEnvelopeInterceptor } from '@shared/presentation';
import { PlainPassword } from '@identity/domain';
import { BcryptPasswordHasher } from '@identity/infrastructure';

import { AppModule } from '../src/app.module';

interface UserRecord {
  id: string;
  email: string;
  passwordHash: string;
  firstName: string;
  lastName: string;
  role: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

interface PropertyRecord {
  id: string;
  internalId: string | null;
  status: string;
  placeId: string;
  formatted: string;
  street: string | null;
  streetNumber: string | null;
  floor: string | null;
  apartment: string | null;
  neighborhood: string | null;
  city: string | null;
  province: string | null;
  country: string | null;
  postalCode: string | null;
  latitude: number;
  longitude: number;
  createdAt: Date;
  updatedAt: Date;
}

interface PropertyFeaturesRecord {
  id: string;
  propertyId: string;
  propertyType: string;
  conservationState: string | null;
  totalAreaM2: number | null;
  coveredAreaM2: number | null;
  uncoveredAreaM2: number | null;
  frontMeters: number | null;
  backMeters: number | null;
  rooms: number | null;
  bedrooms: number | null;
  bathrooms: number | null;
  toilettes: number | null;
  garages: number | null;
  floorNumber: number | null;
  unitIdentifier: string | null;
  constructionYear: number | null;
  orientation: string | null;
  serviceTags: string[];
  amenityTags: string[];
  conditionTags: string[];
  extraFeatures: Record<string, unknown>;
}

interface RefreshTokenRecord {
  id: string;
  userId: string;
  tokenHash: string;
  expiresAt: Date;
  revokedAt: Date | null;
  createdAt: Date;
}

// In-memory stand-in for PrismaService. The configured DATABASE_URL points to
// a private IP that is not reachable from the test sandbox. The PrismaClient
// referenced by PrismaService is replaced by the Jest moduleNameMapper mock at
// test/__mocks__/prisma-client.ts. To make the properties E2E flow exercisable
// we override PrismaService with this in-memory implementation that mirrors the
// shape used by the property and propertyFeatures repositories.
class InMemoryPrismaService implements OnModuleInit, OnModuleDestroy {
  readonly user = {
    findUnique: async ({
      where,
    }: {
      where: { id?: string; email?: string };
    }): Promise<UserRecord | null> => {
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
      const user: UserRecord = {
        id: data.id ?? randomUUID(),
        email: data.email,
        passwordHash: data.passwordHash,
        firstName: data.firstName,
        lastName: data.lastName,
        role: data.role,
        status: 'ACTIVE',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      this.users.set(user.id, user);
      return user as never;
    },
    deleteMany: async () => {
      const count = this.users.size;
      this.users.clear();
      return { count };
    },
  };

  readonly refreshToken = {
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
      const token: RefreshTokenRecord = { ...data };
      this.refreshTokens.set(token.id, token);
      return token as never;
    },
    findUnique: async ({ where }: { where: { id?: string; tokenHash?: string } }) => {
      if (where.id) {
        return (this.refreshTokens.get(where.id) ?? null) as never;
      }
      if (where.tokenHash) {
        for (const token of this.refreshTokens.values()) {
          if (token.tokenHash === where.tokenHash) {
            return token as never;
          }
        }
        return null as never;
      }
      return null as never;
    },
    update: async ({ where, data }: { where: { id: string }; data: { revokedAt: Date } }) => {
      const token = this.refreshTokens.get(where.id);
      if (token) {
        token.revokedAt = data.revokedAt;
      }
      return token as never;
    },
    deleteMany: async () => {
      const count = this.refreshTokens.size;
      this.refreshTokens.clear();
      return { count };
    },
  };

  readonly profile = {
    findUnique: async () => null,
    create: async () => null,
  };

  readonly property = {
    findUnique: async ({ where }: { where: { id?: string; internalId?: string } }) => {
      if (where.id) {
        return (this.properties.get(where.id) ?? null) as never;
      }
      if (where.internalId !== undefined) {
        for (const property of this.properties.values()) {
          if (property.internalId === where.internalId) {
            return property as never;
          }
        }
        return null as never;
      }
      return null as never;
    },
    upsert: async ({
      where,
      create,
      update,
    }: {
      where: { id: string };
      create: {
        id: string;
        internalId: string | null;
        status: string;
        placeId: string;
        formatted: string;
        street: string | null;
        streetNumber: string | null;
        floor: string | null;
        apartment: string | null;
        neighborhood: string | null;
        city: string | null;
        province: string | null;
        country: string | null;
        postalCode: string | null;
        latitude: number;
        longitude: number;
        createdAt: Date;
        updatedAt: Date;
        features?: { create: Record<string, unknown> };
      };
      update: Partial<PropertyRecord> & {
        features?: { upsert: { create: Record<string, unknown>; update: Record<string, unknown> } };
      };
    }) => {
      const existing = this.properties.get(where.id);
      if (existing) {
        Object.assign(existing, update);
        if (update.features?.upsert) {
          this.features.set(existing.id, {
            id: randomUUID(),
            propertyId: existing.id,
            ...(update.features.upsert.update as Partial<PropertyFeaturesRecord>),
          } as PropertyFeaturesRecord);
        }
        existing.updatedAt = new Date();
        return existing as never;
      }
      const property: PropertyRecord = {
        id: create.id,
        internalId: create.internalId,
        status: create.status,
        placeId: create.placeId,
        formatted: create.formatted,
        street: create.street,
        streetNumber: create.streetNumber,
        floor: create.floor,
        apartment: create.apartment,
        neighborhood: create.neighborhood,
        city: create.city,
        province: create.province,
        country: create.country,
        postalCode: create.postalCode,
        latitude: create.latitude,
        longitude: create.longitude,
        createdAt: create.createdAt,
        updatedAt: create.updatedAt,
      };
      this.properties.set(property.id, property);
      if (create.features?.create) {
        this.features.set(property.id, {
          id: randomUUID(),
          propertyId: property.id,
          ...(create.features.create as Partial<PropertyFeaturesRecord>),
        } as PropertyFeaturesRecord);
      }
      return property as never;
    },
    deleteMany: async () => {
      const count = this.properties.size;
      this.properties.clear();
      this.features.clear();
      return { count };
    },
  };

  private readonly users = new Map<string, UserRecord>();
  private readonly refreshTokens = new Map<string, RefreshTokenRecord>();
  private readonly properties = new Map<string, PropertyRecord>();
  private readonly features = new Map<string, PropertyFeaturesRecord>();

  async onModuleInit(): Promise<void> {
    /* no-op */
  }

  async onModuleDestroy(): Promise<void> {
    /* no-op */
  }
}

describe('Properties (e2e)', () => {
  let app: INestApplication;
  let prisma: InMemoryPrismaService;
  let hasher: BcryptPasswordHasher;
  let adminAccessToken: string;
  let clientAccessToken: string;
  const adminEmail = 'e2e-admin-properties@example.com';
  const clientEmail = 'e2e-client-properties@example.com';
  const testPassword = 'TestPassword1!';

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

    const passwordHash = await hasher.hash(PlainPassword.create(testPassword));

    await prisma.user.create({
      data: {
        id: randomUUID(),
        email: adminEmail,
        passwordHash,
        firstName: 'Admin',
        lastName: 'Properties',
        role: 'ADMIN',
      },
    });

    await prisma.user.create({
      data: {
        id: randomUUID(),
        email: clientEmail,
        passwordHash,
        firstName: 'Client',
        lastName: 'User',
        role: 'CLIENT',
      },
    });

    const adminLogin = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: adminEmail, password: testPassword })
      .expect(200);
    adminAccessToken = adminLogin.body.data.accessToken as string;

    const clientLogin = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: clientEmail, password: testPassword })
      .expect(200);
    clientAccessToken = clientLogin.body.data.accessToken as string;
  });

  afterAll(async () => {
    await prisma.property.deleteMany();
    await prisma.refreshToken.deleteMany();
    await prisma.user.deleteMany();
    await app.close();
  });

  const validPayload = () => ({
    address: {
      placeId: 'place-mock-001',
      formatted: 'Av. Corrientes 1234, CABA, Argentina',
      latitude: -34.6037,
      longitude: -58.3816,
    },
    features: {
      propertyType: 'departamento',
      conservationState: 'bueno',
      bedrooms: 2,
      bathrooms: 1,
    },
    internalId: 'PROP001',
  });

  it('1. POST /properties with valid payload and ADMIN role returns 201 + property id', async () => {
    const res = await request(app.getHttpServer())
      .post('/properties')
      .set('Authorization', `Bearer ${adminAccessToken}`)
      .send(validPayload())
      .expect(201);

    expect(res.body).toMatchObject({
      success: true,
      data: {
        id: expect.any(String),
        placeId: 'place-mock-001',
        status: 'disponible',
        internalId: 'PROP001',
      },
    });
  });

  it('2. POST /properties with valid payload and AGENT role returns 201', async () => {
    const agentEmail = 'e2e-agent-properties@example.com';
    await prisma.user.create({
      data: {
        id: randomUUID(),
        email: agentEmail,
        passwordHash: await hasher.hash(PlainPassword.create(testPassword)),
        firstName: 'Agent',
        lastName: 'User',
        role: 'AGENT',
      },
    });
    const agentLogin = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: agentEmail, password: testPassword })
      .expect(200);
    const agentToken = agentLogin.body.data.accessToken as string;

    const res = await request(app.getHttpServer())
      .post('/properties')
      .set('Authorization', `Bearer ${agentToken}`)
      .send(validPayload())
      .expect(201);

    expect(res.body.data.id).toEqual(expect.any(String));
  });

  it('3. POST /properties with CLIENT role returns 403', async () => {
    await request(app.getHttpServer())
      .post('/properties')
      .set('Authorization', `Bearer ${clientAccessToken}`)
      .send(validPayload())
      .expect(403);
  });

  it('4. POST /properties without a token returns 401', async () => {
    await request(app.getHttpServer()).post('/properties').send(validPayload()).expect(401);
  });

  it('5. POST /properties with unknown placeId returns 400 INVALID_ADDRESS', async () => {
    const res = await request(app.getHttpServer())
      .post('/properties')
      .set('Authorization', `Bearer ${adminAccessToken}`)
      .send({
        ...validPayload(),
        address: { ...validPayload().address, placeId: 'unknown-place' },
      })
      .expect(400);

    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('INVALID_ADDRESS');
  });

  it('6. POST /properties with missing placeId returns 400 (validation)', async () => {
    const payload = validPayload() as unknown as Record<string, unknown>;
    const address = payload.address as Record<string, unknown>;
    delete address.placeId;
    await request(app.getHttpServer())
      .post('/properties')
      .set('Authorization', `Bearer ${adminAccessToken}`)
      .send(payload)
      .expect(400);
  });

  it('7. POST /properties with missing propertyType returns 400 (validation)', async () => {
    const payload = validPayload() as unknown as Record<string, unknown>;
    const features = payload.features as Record<string, unknown>;
    delete features.propertyType;
    await request(app.getHttpServer())
      .post('/properties')
      .set('Authorization', `Bearer ${adminAccessToken}`)
      .send(payload)
      .expect(400);
  });

  it('8. POST /properties with malformed internalId returns 400 (validation)', async () => {
    const res = await request(app.getHttpServer())
      .post('/properties')
      .set('Authorization', `Bearer ${adminAccessToken}`)
      .send({ ...validPayload(), internalId: 'ab' })
      .expect(400);

    expect(res.body.success).toBe(false);
  });
});

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

// In-memory stand-in for PrismaService used by property E2E tests.
// Mirrors the shape PrismaService exposes for the delegates touched by the
// PropertiesController code path: user (for auth), refreshToken (for auth),
// and property (for the new GET /properties/:id endpoint).
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
  private readonly properties = new Map<
    string,
    {
      id: string;
      internalCode: string | null;
      status: string;
      propertyType: string;
      ownerProfileId: string | null;
      agentProfileId: string | null;
      createdByUserId: string | null;
      addressPlaceId: string | null;
      addressFormatted: string;
      addressStreet: string | null;
      addressStreetNumber: string | null;
      addressNeighborhood: string | null;
      addressCity: string;
      addressState: string | null;
      addressCountry: string;
      addressPostalCode: string | null;
      addressLatitude: number | null;
      addressLongitude: number | null;
      createdAt: Date;
      updatedAt: Date;
      deletedAt: Date | null;
      features: {
        propertyId: string;
        totalAreaM2: number;
        coveredAreaM2: number;
        rooms: number | null;
        bedrooms: number | null;
        bathrooms: number | null;
        garages: number | null;
        floor: number | null;
        conservationState: string;
        ageYears: number | null;
      } | null;
      tags: Array<{
        propertyId: string;
        tagId: number;
        tag: { id: number; name: string; slug: string; category: string };
      }>;
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

  property = {
    findFirst: async ({
      where,
    }: {
      where: { id?: string; deletedAt?: null | Date; createdByUserId?: string };
    }): Promise<PropertyRow | null> => {
      if (!where.id) {
        return null;
      }
      const row = this.properties.get(where.id);
      if (!row) {
        return null;
      }
      // Honor the soft-delete filter the repository applies: deletedAt must be null.
      if (where.deletedAt === null && row.deletedAt !== null) {
        return null;
      }
      if (where.createdByUserId && row.createdByUserId !== where.createdByUserId) {
        return null;
      }
      return row;
    },
    findMany: async ({
      where,
      skip,
      take,
    }: {
      where?: { deletedAt?: null | Date; createdByUserId?: string };
      skip?: number;
      take?: number;
    }): Promise<PropertyRow[]> => {
      let rows = [...this.properties.values()];
      if (where?.deletedAt === null) {
        rows = rows.filter((r) => r.deletedAt === null);
      }
      if (where?.createdByUserId !== undefined) {
        rows = rows.filter((r) => r.createdByUserId === where.createdByUserId);
      }
      // Newest first — match the Prisma orderBy { createdAt: 'desc' } in the repository.
      rows.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      const start = skip ?? 0;
      const end = start + (take ?? 10);
      return rows.slice(start, end);
    },
    count: async ({
      where,
    }: {
      where?: { deletedAt?: null | Date; createdByUserId?: string };
    }): Promise<number> => {
      let rows = [...this.properties.values()];
      if (where?.deletedAt === null) {
        rows = rows.filter((r) => r.deletedAt === null);
      }
      if (where?.createdByUserId !== undefined) {
        rows = rows.filter((r) => r.createdByUserId === where.createdByUserId);
      }
      return rows.length;
    },
    upsert: async ({
      where,
      create,
      update,
    }: {
      where: { id: string };
      create: {
        id: string;
        internalCode: string | null;
        status: string;
        propertyType: string;
        ownerProfileId: string | null;
        agentProfileId: string | null;
        createdByUserId: string | null;
        addressPlaceId: string | null;
        addressFormatted: string;
        addressStreet: string | null;
        addressStreetNumber: string | null;
        addressNeighborhood: string | null;
        addressCity: string;
        addressState: string | null;
        addressCountry: string;
        addressPostalCode: string | null;
        addressLatitude: number | null;
        addressLongitude: number | null;
      };
      update: {
        deletedAt: Date | null;
      } & Record<string, unknown>;
    }): Promise<PropertyRow> => {
      const existing = this.properties.get(where.id);
      if (existing) {
        Object.assign(existing, update);
        return existing;
      }
      const row: PropertyRow = {
        id: create.id,
        internalCode: create.internalCode,
        status: create.status,
        propertyType: create.propertyType,
        ownerProfileId: create.ownerProfileId,
        agentProfileId: create.agentProfileId,
        createdByUserId: create.createdByUserId ?? null,
        addressPlaceId: create.addressPlaceId,
        addressFormatted: create.addressFormatted,
        addressStreet: create.addressStreet,
        addressStreetNumber: create.addressStreetNumber,
        addressNeighborhood: create.addressNeighborhood,
        addressCity: create.addressCity,
        addressState: create.addressState,
        addressCountry: create.addressCountry,
        addressPostalCode: create.addressPostalCode,
        addressLatitude: create.addressLatitude,
        addressLongitude: create.addressLongitude,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: update.deletedAt ?? null,
        features: null,
        tags: [],
      };
      this.properties.set(row.id, row);
      return row;
    },
    create: async () => {
      // Not exercised by the property listing flow — stubbed to satisfy the type.
      throw new Error('property.create not implemented in InMemoryPrismaService');
    },
    update: async () => {
      // Not exercised by the property listing flow — stubbed to satisfy the type.
      throw new Error('property.update not implemented in InMemoryPrismaService');
    },
  };

  propertyFeatures = {
    upsert: async () => {
      // No-op stub for the create path; the e2e tests do not assert on features.
      return;
    },
  };

  propertyTag = {
    upsert: async () => {
      // No-op stub for the create path; the e2e tests do not assert on characteristics.
      return { id: 1 };
    },
  };

  propertyFeatureTag = {
    deleteMany: async () => {
      // No-op stub for the create path; the e2e tests do not assert on relations.
      return { count: 0 };
    },
    createMany: async () => {
      // No-op stub for the create path; the e2e tests do not assert on relations.
      return { count: 0 };
    },
  };

  // Mirror Prisma's $transaction: invoke the callback with the same in-memory
  // service as the "transaction client" so all upsert/deleteMany calls succeed.

  $transaction: any = async (fn: (tx: unknown) => Promise<unknown>) => {
    return fn(this);
  };

  // Test helper — seeds a property row directly in the in-memory store.
  seedProperty(row: PropertyRow): void {
    this.properties.set(row.id, row);
  }
}

interface PropertyRow {
  id: string;
  internalCode: string | null;
  status: string;
  propertyType: string;
  ownerProfileId: string | null;
  agentProfileId: string | null;
  createdByUserId: string | null;
  addressPlaceId: string | null;
  addressFormatted: string;
  addressStreet: string | null;
  addressStreetNumber: string | null;
  addressNeighborhood: string | null;
  addressCity: string;
  addressState: string | null;
  addressCountry: string;
  addressPostalCode: string | null;
  addressLatitude: number | null;
  addressLongitude: number | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
  features: {
    propertyId: string;
    totalAreaM2: number;
    coveredAreaM2: number;
    rooms: number | null;
    bedrooms: number | null;
    bathrooms: number | null;
    garages: number | null;
    floor: number | null;
    conservationState: string;
    ageYears: number | null;
  } | null;
  tags: Array<{
    propertyId: string;
    tagId: number;
    tag: { id: number; name: string; slug: string; category: string };
  }>;
}

const KNOWN_PROPERTY_ID = '11111111-1111-4111-8111-111111111111';
const SOFT_DELETED_PROPERTY_ID = '22222222-2222-4222-8222-222222222222';
const MISSING_PROPERTY_ID = '33333333-3333-4333-8333-333333333333';
const INVALID_UUID = 'not-a-uuid';

function makePropertyRow(overrides: {
  id: string;
  deletedAt?: Date | null;
  createdByUserId?: string | null;
  internalCode?: string;
}): PropertyRow {
  const now = new Date('2026-01-15T10:00:00.000Z');
  return {
    id: overrides.id,
    internalCode: overrides.internalCode ?? 'PROP-001',
    status: 'disponible',
    propertyType: 'departamento',
    ownerProfileId: 'owner-profile-1',
    agentProfileId: 'agent-profile-1',
    createdByUserId: overrides.createdByUserId ?? null,
    addressPlaceId: 'place-1',
    addressFormatted: 'Av. Corrientes 1234, CABA',
    addressStreet: 'Av. Corrientes',
    addressStreetNumber: '1234',
    addressNeighborhood: 'San Nicolas',
    addressCity: 'CABA',
    addressState: 'Buenos Aires',
    addressCountry: 'Argentina',
    addressPostalCode: 'C1043',
    addressLatitude: -34.6037,
    addressLongitude: -58.3816,
    createdAt: now,
    updatedAt: now,
    deletedAt: overrides.deletedAt === undefined ? null : overrides.deletedAt,
    features: {
      propertyId: overrides.id,
      totalAreaM2: 80,
      coveredAreaM2: 75,
      rooms: 3,
      bedrooms: 2,
      bathrooms: 1,
      garages: 1,
      floor: 5,
      conservationState: 'bueno',
      ageYears: 10,
    },
    tags: [
      {
        propertyId: overrides.id,
        tagId: 1,
        tag: { id: 1, name: 'Piscina', slug: 'piscina', category: 'amenidad' },
      },
    ],
  };
}

describe('Properties — GET /properties/:id (e2e)', () => {
  let app: INestApplication;
  let prisma: InMemoryPrismaService;
  let hasher: BcryptPasswordHasher;
  let accessToken: string;
  const adminEmail = 'e2e-property-admin@example.com';
  const adminPassword = 'TestPassword1!';

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

    // Seed an admin user.
    const passwordHash = await hasher.hash(PlainPassword.create(adminPassword));
    await prisma.user.create({
      data: {
        id: randomUUID(),
        email: adminEmail,
        passwordHash,
        firstName: 'Property',
        lastName: 'Admin',
        role: 'ADMIN',
      },
    });

    // Sanity check: domain value objects must accept the email used in tests.
    new UserEmail(adminEmail);

    // Login to get a JWT.
    const login = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: adminEmail, password: adminPassword })
      .expect(200);
    accessToken = login.body.data.accessToken as string;

    // Seed two property rows: one active, one soft-deleted.
    prisma.seedProperty(makePropertyRow({ id: KNOWN_PROPERTY_ID }));
    prisma.seedProperty(
      makePropertyRow({
        id: SOFT_DELETED_PROPERTY_ID,
        deletedAt: new Date('2026-02-01T00:00:00.000Z'),
      }),
    );
  });

  afterAll(async () => {
    await prisma.refreshToken.deleteMany();
    await prisma.user.deleteMany();
    await app.close();
  });

  it('1. GET /properties/:id returns 200 + PropertyResponse for an existing property', async () => {
    const res = await request(app.getHttpServer())
      .get(`/properties/${KNOWN_PROPERTY_ID}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(res.body).toEqual({
      success: true,
      message: 'Propiedad encontrada',
      data: {
        id: KNOWN_PROPERTY_ID,
        internalCode: 'PROP-001',
        status: 'disponible',
        propertyType: 'departamento',
        ownerProfileId: 'owner-profile-1',
        agentProfileId: 'agent-profile-1',
        createdByUserId: null,
        address: {
          placeId: 'place-1',
          formatted: 'Av. Corrientes 1234, CABA',
          street: 'Av. Corrientes',
          streetNumber: '1234',
          neighborhood: 'San Nicolas',
          city: 'CABA',
          state: 'Buenos Aires',
          country: 'Argentina',
          postalCode: 'C1043',
          latitude: -34.6037,
          longitude: -58.3816,
        },
        features: {
          totalAreaM2: 80,
          coveredAreaM2: 75,
          rooms: 3,
          bedrooms: 2,
          bathrooms: 1,
          garages: 1,
          floor: 5,
          conservationState: 'bueno',
          ageYears: 10,
        },
        characteristics: [
          {
            id: 1,
            name: 'Piscina',
            slug: 'piscina',
            category: 'amenidad',
          },
        ],
        createdAt: '2026-01-15T10:00:00.000Z',
        updatedAt: '2026-01-15T10:00:00.000Z',
        deletedAt: null,
      },
    });
  });

  it('2. GET /properties/:id returns 404 when the property does not exist', async () => {
    const res = await request(app.getHttpServer())
      .get(`/properties/${MISSING_PROPERTY_ID}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(404);

    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('NOT_FOUND');
    expect(res.body.error.message).toMatch(/Property with id/);
  });

  it('3. GET /properties/:id returns 404 when the property is soft-deleted', async () => {
    const res = await request(app.getHttpServer())
      .get(`/properties/${SOFT_DELETED_PROPERTY_ID}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(404);

    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('NOT_FOUND');
  });

  it('4. GET /properties/:id returns 400 when the id is not a valid UUID', async () => {
    const res = await request(app.getHttpServer())
      .get(`/properties/${INVALID_UUID}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(400);

    expect(res.body.success).toBe(false);
  });

  it('5. GET /properties/:id returns 401 when no auth token is provided', async () => {
    const res = await request(app.getHttpServer())
      .get(`/properties/${KNOWN_PROPERTY_ID}`)
      .expect(401);

    expect(res.body.success).toBe(false);
  });
});

describe('Properties — listing endpoints (e2e)', () => {
  let app: INestApplication;
  let prisma: InMemoryPrismaService;
  let hasher: BcryptPasswordHasher;
  let adminToken: string;
  let agentToken: string;
  let adminUserId: string;
  let agentUserId: string;
  const adminEmail = 'e2e-list-admin@example.com';
  const agentEmail = 'e2e-list-agent@example.com';
  const userPassword = 'TestPassword1!';

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

    const passwordHash = await hasher.hash(PlainPassword.create(userPassword));

    // Seed an admin and an agent user.
    adminUserId = randomUUID();
    await prisma.user.create({
      data: {
        id: adminUserId,
        email: adminEmail,
        passwordHash,
        firstName: 'Listing',
        lastName: 'Admin',
        role: 'ADMIN',
      },
    });

    agentUserId = randomUUID();
    await prisma.user.create({
      data: {
        id: agentUserId,
        email: agentEmail,
        passwordHash,
        firstName: 'Listing',
        lastName: 'Agent',
        role: 'AGENT',
      },
    });

    // Login both users.
    const adminLogin = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: adminEmail, password: userPassword })
      .expect(200);
    adminToken = adminLogin.body.data.accessToken as string;

    const agentLogin = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: agentEmail, password: userPassword })
      .expect(200);
    agentToken = agentLogin.body.data.accessToken as string;
  });

  afterAll(async () => {
    await prisma.refreshToken.deleteMany();
    await prisma.user.deleteMany();
    await app.close();
  });

  it('1. GET /properties returns a paginated list for ADMIN', async () => {
    // Seed two fresh active properties for this scenario (no creatorId filter).
    prisma.seedProperty(makePropertyRow({ id: randomUUID(), internalCode: 'LIST-A' }));
    prisma.seedProperty(makePropertyRow({ id: randomUUID(), internalCode: 'LIST-B' }));

    const res = await request(app.getHttpServer())
      .get('/properties?page=1&limit=10')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThanOrEqual(2);
    expect(res.body.meta).toMatchObject({
      page: 1,
      limit: 10,
    });
    expect(typeof res.body.meta.total).toBe('number');
    expect(typeof res.body.meta.totalPages).toBe('number');
  });

  it('2. GET /properties returns 403 for AGENT (admin-only)', async () => {
    const res = await request(app.getHttpServer())
      .get('/properties?page=1&limit=10')
      .set('Authorization', `Bearer ${agentToken}`)
      .expect(403);

    expect(res.body.success).toBe(false);
  });

  it('3. GET /properties/me returns only the authenticated user own properties', async () => {
    // Seed: 2 created by the agent, 1 created by someone else.
    const idAgent1 = randomUUID();
    const idAgent2 = randomUUID();
    const idOther = randomUUID();
    prisma.seedProperty(
      makePropertyRow({ id: idAgent1, createdByUserId: agentUserId, internalCode: 'MINE-1' }),
    );
    prisma.seedProperty(
      makePropertyRow({ id: idAgent2, createdByUserId: agentUserId, internalCode: 'MINE-2' }),
    );
    prisma.seedProperty(
      makePropertyRow({ id: idOther, createdByUserId: adminUserId, internalCode: 'NOT-MINE' }),
    );

    const res = await request(app.getHttpServer())
      .get('/properties/me?page=1&limit=10')
      .set('Authorization', `Bearer ${agentToken}`)
      .expect(200);

    expect(res.body.success).toBe(true);
    const returnedIds = (res.body.data as Array<{ id: string }>).map((d) => d.id);
    expect(returnedIds).toContain(idAgent1);
    expect(returnedIds).toContain(idAgent2);
    expect(returnedIds).not.toContain(idOther);
  });

  it('4. GET /properties/me returns an empty list and meta.total=0 for users with no properties', async () => {
    // Create a brand new user with no properties at all.
    const orphanEmail = 'e2e-list-orphan@example.com';
    const orphanPassword = 'TestPassword1!';
    const orphanId = randomUUID();
    const passwordHash = await hasher.hash(PlainPassword.create(orphanPassword));
    await prisma.user.create({
      data: {
        id: orphanId,
        email: orphanEmail,
        passwordHash,
        firstName: 'NoProps',
        lastName: 'User',
        role: 'AGENT',
      },
    });
    const orphanLogin = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: orphanEmail, password: orphanPassword })
      .expect(200);
    const orphanToken = orphanLogin.body.data.accessToken as string;

    const res = await request(app.getHttpServer())
      .get('/properties/me?page=1&limit=10')
      .set('Authorization', `Bearer ${orphanToken}`)
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.data).toEqual([]);
    expect(res.body.meta.total).toBe(0);
    expect(res.body.meta.totalPages).toBe(0);
  });

  it('5. POST /properties stores createdByUserId from the JWT', async () => {
    const res = await request(app.getHttpServer())
      .post('/properties')
      .set('Authorization', `Bearer ${agentToken}`)
      .send({
        propertyType: 'departamento',
        address: {
          addressFormatted: 'Test Address 123',
          addressCity: 'CABA',
          addressCountry: 'Argentina',
        },
      })
      .expect(201);

    expect(res.body.success).toBe(true);
    expect(res.body.data.createdByUserId).toBe(agentUserId);

    // Confirm the value is also readable via GET /properties/me.
    const list = await request(app.getHttpServer())
      .get('/properties/me?page=1&limit=50')
      .set('Authorization', `Bearer ${agentToken}`)
      .expect(200);

    const createdId = res.body.data.id as string;
    const found = (list.body.data as Array<{ id: string }>).find((p) => p.id === createdId);
    expect(found).toBeDefined();
  });

  it('6. soft-deleted properties are excluded from both listings', async () => {
    // Seed a soft-deleted property tagged to the agent.
    const deletedId = randomUUID();
    prisma.seedProperty(
      makePropertyRow({
        id: deletedId,
        createdByUserId: agentUserId,
        deletedAt: new Date('2026-02-15T00:00:00.000Z'),
        internalCode: 'DELETED-MINE',
      }),
    );

    const meRes = await request(app.getHttpServer())
      .get('/properties/me?page=1&limit=50')
      .set('Authorization', `Bearer ${agentToken}`)
      .expect(200);

    const meIds = (meRes.body.data as Array<{ id: string }>).map((p) => p.id);
    expect(meIds).not.toContain(deletedId);

    const allRes = await request(app.getHttpServer())
      .get('/properties?page=1&limit=50')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    const allIds = (allRes.body.data as Array<{ id: string }>).map((p) => p.id);
    expect(allIds).not.toContain(deletedId);
  });
});

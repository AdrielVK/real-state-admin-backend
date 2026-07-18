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

// In-memory stand-in for PrismaService used by the PATCH /properties/:id/features
// E2E test. Mirrors the surface that the property create + edit + findById code
// path exercises: user (for auth), refreshToken (for auth), and property (for
// the create + PATCH features flow). The propertyFeatures.upsert delegate
// actually persists the features onto the parent property row so subsequent
// reads via findFirst see the new state.
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
  private readonly properties = new Map<string, PropertyRow>();

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
    }): Promise<PropertyRow | null> => {
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
      if (where.deletedAt === null && row.deletedAt !== null) {
        return null;
      }
      if (where.createdByUserId && row.createdByUserId !== where.createdByUserId) {
        return null;
      }
      return row;
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
      update: { deletedAt: Date | null } & Record<string, unknown>;
    }): Promise<PropertyRow> => {
      const existing = this.properties.get(where.id);
      if (existing) {
        Object.assign(existing, update);
        return existing;
      }
      const now = new Date();
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
        createdAt: now,
        updatedAt: now,
        deletedAt: update.deletedAt ?? null,
        features: null,
        tags: [],
      };
      this.properties.set(row.id, row);
      return row;
    },
    create: async () => {
      throw new Error('property.create not implemented in InMemoryPrismaService');
    },
    update: async () => {
      throw new Error('property.update not implemented in InMemoryPrismaService');
    },
  };

  propertyFeatures = {
    upsert: async ({
      where,
      create,
      update,
    }: {
      where: { propertyId: string };
      create: PropertyFeaturesData;
      update: PropertyFeaturesData;
    }): Promise<PropertyFeaturesData> => {
      const row = this.properties.get(where.propertyId);
      if (!row) {
        throw new Error(`Property ${where.propertyId} not found in InMemoryPrismaService`);
      }
      const merged: PropertyFeaturesData = {
        ...row.features,
        ...update,
        ...(row.features ? {} : create),
      };
      row.features = merged;
      return merged;
    },
  };

  propertyTag = {
    upsert: async () => {
      return { id: 1 };
    },
  };

  propertyFeatureTag = {
    deleteMany: async () => ({ count: 0 }),
    createMany: async () => ({ count: 0 }),
  };

  $transaction: any = async (fn: (tx: unknown) => Promise<unknown>) => {
    return fn(this);
  };

  // Test helper — seeds a property row directly in the in-memory store.
  seedProperty(row: PropertyRow): void {
    this.properties.set(row.id, row);
  }

  // Test helper — fetches a property row directly from the in-memory store.
  getProperty(id: string): PropertyRow | undefined {
    return this.properties.get(id);
  }
}

interface PropertyFeaturesData {
  propertyId?: string;
  totalAreaM2: number;
  coveredAreaM2: number;
  rooms: number | null;
  bedrooms: number | null;
  bathrooms: number | null;
  garages: number | null;
  floor: number | null;
  conservationState: string | null;
  ageYears: number | null;
  createdAt?: Date;
  updatedAt?: Date;
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
  features: PropertyFeaturesData | null;
  tags: Array<{
    propertyId: string;
    tagId: number;
    tag: { id: number; name: string; slug: string; category: string };
  }>;
}

const SEED_PROPERTY_ID = '11111111-1111-4111-8111-111111111111';
const SEED_PROPERTY_NO_FEATURES_ID = '44444444-4444-4444-8444-444444444444';
const SOFT_DELETED_PROPERTY_ID = '22222222-2222-4222-8222-222222222222';
const MISSING_PROPERTY_ID = '33333333-3333-4333-8333-333333333333';
const INVALID_UUID = 'not-a-uuid';

function makePropertyRow(overrides: {
  id: string;
  deletedAt?: Date | null;
  createdByUserId?: string | null;
  internalCode?: string;
  features?: PropertyFeaturesData | null;
}): PropertyRow {
  const now = new Date('2026-01-15T10:00:00.000Z');
  const baseFeatures: PropertyFeaturesData = {
    totalAreaM2: 100,
    coveredAreaM2: 80,
    rooms: 3,
    bedrooms: 2,
    bathrooms: 1,
    garages: 0,
    floor: 2,
    conservationState: 'bueno',
    ageYears: 5,
    createdAt: now,
    updatedAt: now,
  };
  const features = overrides.features === undefined ? baseFeatures : overrides.features;
  return {
    id: overrides.id,
    internalCode: overrides.internalCode ?? 'PROP-001',
    status: 'disponible',
    propertyType: 'departamento',
    ownerProfileId: null,
    agentProfileId: null,
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
    features,
    tags: [],
  };
}

describe('Properties — PATCH /properties/:id/features (e2e)', () => {
  let app: INestApplication;
  let prisma: InMemoryPrismaService;
  let hasher: BcryptPasswordHasher;
  let adminToken: string;
  let agentToken: string;
  let administrativeToken: string;
  const adminEmail = 'e2e-feat-admin@example.com';
  const agentEmail = 'e2e-feat-agent@example.com';
  const administrativeEmail = 'e2e-feat-administrative@example.com';
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

    await prisma.user.create({
      data: {
        id: randomUUID(),
        email: adminEmail,
        passwordHash,
        firstName: 'Feat',
        lastName: 'Admin',
        role: 'ADMIN',
      },
    });
    await prisma.user.create({
      data: {
        id: randomUUID(),
        email: agentEmail,
        passwordHash,
        firstName: 'Feat',
        lastName: 'Agent',
        role: 'AGENT',
      },
    });
    await prisma.user.create({
      data: {
        id: randomUUID(),
        email: administrativeEmail,
        passwordHash,
        firstName: 'Feat',
        lastName: 'Administrative',
        role: 'ADMINISTRATIVE',
      },
    });

    new UserEmail(adminEmail);

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

    const administrativeLogin = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: administrativeEmail, password: userPassword })
      .expect(200);
    administrativeToken = administrativeLogin.body.data.accessToken as string;

    prisma.seedProperty(makePropertyRow({ id: SEED_PROPERTY_ID }));
    prisma.seedProperty(makePropertyRow({ id: SEED_PROPERTY_NO_FEATURES_ID, features: null }));
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

  it('1. PATCH /properties/:id/features returns 200 + updated bedroom for ADMIN', async () => {
    prisma.seedProperty(makePropertyRow({ id: SEED_PROPERTY_ID }));

    const res = await request(app.getHttpServer())
      .patch(`/properties/${SEED_PROPERTY_ID}/features`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ bedrooms: 4 })
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.message).toBe('Características físicas actualizadas con éxito');
    expect(res.body.data.id).toBe(SEED_PROPERTY_ID);
    expect(res.body.data.features).not.toBeNull();
    expect(res.body.data.features.bedrooms).toBe(4);
    // Existing fields preserved
    expect(res.body.data.features.totalAreaM2).toBeCloseTo(100, 5);
    expect(res.body.data.features.rooms).toBe(3);
    expect(res.body.data.features.bathrooms).toBe(1);
    expect(res.body.data.features.conservationState).toBe('bueno');
  });

  it('2. PATCH /properties/:id/features returns 200 for AGENT', async () => {
    prisma.seedProperty(makePropertyRow({ id: SEED_PROPERTY_ID }));

    const res = await request(app.getHttpServer())
      .patch(`/properties/${SEED_PROPERTY_ID}/features`)
      .set('Authorization', `Bearer ${agentToken}`)
      .send({ bathrooms: 3 })
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.data.features.bathrooms).toBe(3);
  });

  it('3. PATCH with an empty payload preserves all existing features (200)', async () => {
    prisma.seedProperty(makePropertyRow({ id: SEED_PROPERTY_ID }));

    const res = await request(app.getHttpServer())
      .patch(`/properties/${SEED_PROPERTY_ID}/features`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({})
      .expect(200);

    expect(res.body.data.features.bedrooms).toBe(2);
    expect(res.body.data.features.bathrooms).toBe(1);
    expect(res.body.data.features.rooms).toBe(3);
    expect(res.body.data.features.conservationState).toBe('bueno');
  });

  it('4. PATCH with explicit null clears the field (200)', async () => {
    prisma.seedProperty(makePropertyRow({ id: SEED_PROPERTY_ID }));

    const res = await request(app.getHttpServer())
      .patch(`/properties/${SEED_PROPERTY_ID}/features`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ bedrooms: null })
      .expect(200);

    expect(res.body.data.features.bedrooms).toBeNull();
    // Other fields still intact
    expect(res.body.data.features.rooms).toBe(3);
  });

  it('5. PATCH creates features from null when mandatory fields are provided (200)', async () => {
    prisma.seedProperty(makePropertyRow({ id: SEED_PROPERTY_NO_FEATURES_ID, features: null }));

    const res = await request(app.getHttpServer())
      .patch(`/properties/${SEED_PROPERTY_NO_FEATURES_ID}/features`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        totalAreaM2: 120,
        coveredAreaM2: 90,
        conservationState: 'excelente',
      })
      .expect(200);

    expect(res.body.data.features).not.toBeNull();
    expect(res.body.data.features.totalAreaM2).toBeCloseTo(120, 5);
    expect(res.body.data.features.coveredAreaM2).toBeCloseTo(90, 5);
    expect(res.body.data.features.conservationState).toBe('excelente');
    expect(res.body.data.features.rooms).toBeNull();
  });

  it('6. PATCH persists the new features so a subsequent GET /properties/:id reflects them', async () => {
    prisma.seedProperty(makePropertyRow({ id: SEED_PROPERTY_ID }));

    await request(app.getHttpServer())
      .patch(`/properties/${SEED_PROPERTY_ID}/features`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ bedrooms: 4, ageYears: 12 })
      .expect(200);

    const get = await request(app.getHttpServer())
      .get(`/properties/${SEED_PROPERTY_ID}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    expect(get.body.data.features.bedrooms).toBe(4);
    expect(get.body.data.features.ageYears).toBe(12);
    expect(get.body.data.features.conservationState).toBe('bueno');
  });

  it('7. PATCH /properties/:id/features returns 404 for a non-existent property', async () => {
    const res = await request(app.getHttpServer())
      .patch(`/properties/${MISSING_PROPERTY_ID}/features`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ bedrooms: 4 })
      .expect(404);

    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('NOT_FOUND');
  });

  it('8. PATCH /properties/:id/features returns 404 for a soft-deleted property', async () => {
    const res = await request(app.getHttpServer())
      .patch(`/properties/${SOFT_DELETED_PROPERTY_ID}/features`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ bedrooms: 4 })
      .expect(404);

    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('NOT_FOUND');
  });

  it('9. PATCH /properties/:id/features returns 403 for ADMINISTRATIVE role', async () => {
    const res = await request(app.getHttpServer())
      .patch(`/properties/${SEED_PROPERTY_ID}/features`)
      .set('Authorization', `Bearer ${administrativeToken}`)
      .send({ bedrooms: 4 })
      .expect(403);

    expect(res.body.success).toBe(false);
  });

  it('10. PATCH /properties/:id/features returns 400 for an invalid UUID', async () => {
    const res = await request(app.getHttpServer())
      .patch(`/properties/${INVALID_UUID}/features`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ bedrooms: 4 })
      .expect(400);

    expect(res.body.success).toBe(false);
  });

  it('11. PATCH /properties/:id/features returns 400 for negative totalAreaM2', async () => {
    prisma.seedProperty(makePropertyRow({ id: SEED_PROPERTY_ID }));

    const res = await request(app.getHttpServer())
      .patch(`/properties/${SEED_PROPERTY_ID}/features`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ totalAreaM2: -10 })
      .expect(400);

    expect(res.body.success).toBe(false);
  });

  it('12. PATCH /properties/:id/features returns 400 for an invalid conservationState', async () => {
    prisma.seedProperty(makePropertyRow({ id: SEED_PROPERTY_ID }));

    const res = await request(app.getHttpServer())
      .patch(`/properties/${SEED_PROPERTY_ID}/features`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ conservationState: 'invalid' })
      .expect(400);

    expect(res.body.success).toBe(false);
  });

  it('13. PATCH /properties/:id/features returns 400 when first-creation omits a mandatory field', async () => {
    prisma.seedProperty(makePropertyRow({ id: SEED_PROPERTY_NO_FEATURES_ID, features: null }));

    const res = await request(app.getHttpServer())
      .patch(`/properties/${SEED_PROPERTY_NO_FEATURES_ID}/features`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ bedrooms: 3 })
      .expect(400);

    expect(res.body.success).toBe(false);
  });

  it('14. PATCH /properties/:id/features returns 401 when no auth token is provided', async () => {
    const res = await request(app.getHttpServer())
      .patch(`/properties/${SEED_PROPERTY_ID}/features`)
      .send({ bedrooms: 4 })
      .expect(401);

    expect(res.body.success).toBe(false);
  });
});

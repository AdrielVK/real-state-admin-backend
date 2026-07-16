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
      where: { id?: string; deletedAt?: null | Date };
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
      return row;
    },
    upsert: async () => {
      // Not exercised by GET /properties/:id — stubbed to satisfy the type.
      throw new Error('property.upsert not implemented in InMemoryPrismaService');
    },
    create: async () => {
      // Not exercised by GET /properties/:id — stubbed to satisfy the type.
      throw new Error('property.create not implemented in InMemoryPrismaService');
    },
    update: async () => {
      // Not exercised by GET /properties/:id — stubbed to satisfy the type.
      throw new Error('property.update not implemented in InMemoryPrismaService');
    },
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

function makePropertyRow(overrides: { id: string; deletedAt?: Date | null }): PropertyRow {
  const now = new Date('2026-01-15T10:00:00.000Z');
  return {
    id: overrides.id,
    internalCode: 'PROP-001',
    status: 'disponible',
    propertyType: 'departamento',
    ownerProfileId: 'owner-profile-1',
    agentProfileId: 'agent-profile-1',
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

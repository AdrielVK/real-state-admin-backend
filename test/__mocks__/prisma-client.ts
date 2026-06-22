// Mock of the Prisma generated client for E2E tests
// Prevents import.meta.url errors when Jest runs in CJS mode

export class PrismaClient {
  $connect = jest.fn();
  $disconnect = jest.fn();
  $on = jest.fn();
  $transaction = jest.fn();
  $use = jest.fn();

  user = {
    findMany: jest.fn().mockResolvedValue([]),
    findUnique: jest.fn().mockResolvedValue(null),
    findFirst: jest.fn().mockResolvedValue(null),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn().mockResolvedValue(0),
  };
}

export default { PrismaClient };

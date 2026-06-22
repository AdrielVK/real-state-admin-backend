import { Entity } from '../entity';
import { Identifier } from '../value-objects/identifier';

class TestId extends Identifier<string> {}

interface TestProps {
  name: string;
  email: string;
}

class TestEntity extends Entity<TestId> {
  private readonly _name: string;
  private readonly _email: string;

  constructor(id: TestId, name: string, email: string) {
    super(id);
    this._name = name;
    this._email = email;
  }

  get name(): string {
    return this._name;
  }

  get email(): string {
    return this._email;
  }

  toPrimitives(): TestProps {
    return { name: this._name, email: this._email };
  }
}

describe('Identifier', () => {
  it('should return the wrapped value via toValue()', () => {
    const id = new TestId('abc-123');
    expect(id.toValue()).toBe('abc-123');
  });

  it('should return string representation via toString()', () => {
    const id = new TestId('abc-123');
    expect(id.toString()).toBe('abc-123');
  });

  it('should be equal to another Identifier with the same value', () => {
    const id1 = new TestId('abc-123');
    const id2 = new TestId('abc-123');
    expect(id1.equals(id2)).toBe(true);
  });

  it('should NOT be equal to another Identifier with a different value', () => {
    const id1 = new TestId('abc-123');
    const id2 = new TestId('xyz-789');
    expect(id1.equals(id2)).toBe(false);
  });

  it('should NOT be equal to null or undefined', () => {
    const id = new TestId('abc-123');
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
    expect(id.equals(null as TestId)).toBe(false);

    expect(id.equals(undefined as TestId)).toBe(false);
  });
});

describe('Entity', () => {
  it('should be equal to another Entity with the same id', () => {
    const id = new TestId('same-id');
    const entity1 = new TestEntity(id, 'Alice', 'alice@test.com');
    const entity2 = new TestEntity(id, 'Bob', 'bob@test.com');
    expect(entity1.equals(entity2)).toBe(true);
  });

  it('should NOT be equal to another Entity with a different id', () => {
    const entity1 = new TestEntity(new TestId('id-1'), 'Alice', 'alice@test.com');
    const entity2 = new TestEntity(new TestId('id-2'), 'Alice', 'alice@test.com');
    expect(entity1.equals(entity2)).toBe(false);
  });

  it('should expose its id', () => {
    const id = new TestId('entity-id');
    const entity = new TestEntity(id, 'Alice', 'alice@test.com');
    expect(entity.id.toValue()).toBe('entity-id');
  });

  it('should return primitives via toPrimitives()', () => {
    const id = new TestId('entity-id');
    const entity = new TestEntity(id, 'Alice', 'alice@test.com');
    expect(entity.toPrimitives()).toEqual({ name: 'Alice', email: 'alice@test.com' });
  });

  it('should NOT be equal to null or undefined', () => {
    const entity = new TestEntity(new TestId('id'), 'Alice', 'alice@test.com');
    expect(entity.equals(null as unknown as TestEntity)).toBe(false);
    expect(entity.equals(undefined as unknown as TestEntity)).toBe(false);
  });
});

import { RandomPropertyInternalIdGenerator } from '../adapters/internal-id-generator';

describe('RandomPropertyInternalIdGenerator', () => {
  let generator: RandomPropertyInternalIdGenerator;

  beforeEach(() => {
    generator = new RandomPropertyInternalIdGenerator();
  });

  it('should generate a 7-character string', () => {
    const id = generator.generate();
    expect(id).toHaveLength(7);
  });

  it('should generate an alphanumeric uppercase string', () => {
    for (let i = 0; i < 50; i++) {
      const id = generator.generate();
      expect(id).toMatch(/^[A-Z0-9]{7}$/);
    }
  });

  it('should produce different ids on each call (eventually)', () => {
    const ids = new Set<string>();
    for (let i = 0; i < 100; i++) {
      ids.add(generator.generate());
    }
    // With 36^7 = 78 billion possible codes, 100 should give mostly unique
    // values. We allow for a small collision margin to avoid flakiness.
    expect(ids.size).toBeGreaterThan(90);
  });
});

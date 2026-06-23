import { PlainPassword } from '../../domain/value-objects/plain-password.value-object';
import { BcryptPasswordHasher } from '../hashers/bcrypt-password-hasher';

describe('BcryptPasswordHasher', () => {
  let hasher: BcryptPasswordHasher;

  beforeEach(() => {
    hasher = new BcryptPasswordHasher();
  });

  describe('hash()', () => {
    it('should return a non-empty bcrypt-shaped string', async () => {
      const password = PlainPassword.create('Secure1!');

      const hash = await hasher.hash(password);

      expect(typeof hash).toBe('string');
      expect(hash.length).toBeGreaterThan(0);
      expect(hash.startsWith('$2b$') || hash.startsWith('$2a$')).toBe(true);
    });

    it('should produce a different hash for the same password on each call (salt randomness)', async () => {
      const password = PlainPassword.create('Secure1!');

      const hash1 = await hasher.hash(password);
      const hash2 = await hasher.hash(password);

      expect(hash1).not.toBe(hash2);
    });
  });

  describe('compare()', () => {
    it('should return true when the plain password matches the hash', async () => {
      const password = PlainPassword.create('Secure1!');
      const hash = await hasher.hash(password);

      const matches = await hasher.compare(password, hash);

      expect(matches).toBe(true);
    });

    it('should return false when the plain password does NOT match the hash', async () => {
      const password = PlainPassword.create('Secure1!');
      const hash = await hasher.hash(password);
      const wrong = PlainPassword.create('OtherPass1!');

      const matches = await hasher.compare(wrong, hash);

      expect(matches).toBe(false);
    });

    it('should return false when the hash is invalid', async () => {
      const password = PlainPassword.create('Secure1!');

      const matches = await hasher.compare(password, 'not-a-real-bcrypt-hash');

      expect(matches).toBe(false);
    });
  });
});

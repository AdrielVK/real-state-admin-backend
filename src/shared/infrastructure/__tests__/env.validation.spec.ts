import 'reflect-metadata';

import { validate } from '../config/env.validation';

describe('EnvironmentVariables validation', () => {
  it('should pass with valid environment variables', () => {
    const env = {
      DATABASE_URL: 'postgresql://localhost:5432/test',
      JWT_SECRET: 'secret',
      JWT_EXPIRATION: '1d',
      PORT: '3000',
      NODE_ENV: 'development',
    };
    const result = validate(env);
    expect(result).toBeDefined();
  });

  it('should fail when DATABASE_URL is missing', () => {
    const env = {
      JWT_SECRET: 'secret',
      JWT_EXPIRATION: '1d',
      PORT: '3000',
      NODE_ENV: 'development',
    };
    expect(() => validate(env)).toThrow();
  });

  it('should fail when JWT_SECRET is missing', () => {
    const env = {
      DATABASE_URL: 'postgresql://localhost:5432/test',
      JWT_EXPIRATION: '1d',
      PORT: '3000',
      NODE_ENV: 'development',
    };
    expect(() => validate(env)).toThrow();
  });

  it('should fail when PORT is not a number', () => {
    const env = {
      DATABASE_URL: 'postgresql://localhost:5432/test',
      JWT_SECRET: 'secret',
      JWT_EXPIRATION: '1d',
      PORT: 'not-a-number',
      NODE_ENV: 'development',
    };
    expect(() => validate(env)).toThrow();
  });

  it('should default PORT to 3000 when not provided', () => {
    const env = {
      DATABASE_URL: 'postgresql://localhost:5432/test',
      JWT_SECRET: 'secret',
      JWT_EXPIRATION: '1d',
      NODE_ENV: 'development',
    };
    const result = validate(env);
    expect(result.PORT).toBe(3000);
  });
});

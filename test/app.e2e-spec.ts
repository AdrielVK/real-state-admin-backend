import type { INestApplication } from '@nestjs/common';
import { Test, type TestingModule } from '@nestjs/testing';

import request from 'supertest';
import type { App } from 'supertest/types';

import { ResponseEnvelopeInterceptor } from '@shared/presentation';

import { AppModule } from './../src/app.module';

describe('AppModule (e2e)', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalInterceptors(new ResponseEnvelopeInterceptor());
    await app.init();
  });

  it('/users/health (GET)', () => {
    return request(app.getHttpServer())
      .get('/users/health')
      .expect(200)
      .expect((res) => {
        expect(res.body).toEqual({
          success: true,
          data: { status: 'ok' },
        });
      });
  });

  afterEach(async () => {
    await app.close();
  });
});

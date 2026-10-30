import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';

/**
 * Requires a valid environment (`.env` with DATABASE_URL, JWT_SECRET,
 * FRONTEND_URLS) because the full AppModule is bootstrapped.
 */
describe('AppController (e2e)', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    await app.init();
  });

  it('/api/health (GET) is public', () => {
    return request(app.getHttpServer())
      .get('/api/health')
      .expect(200)
      .expect((res) => {
        expect((res.body as { status: string }).status).toBe('ok');
      });
  });

  it('/api/tenants/me (GET) requires a Bearer token', () => {
    return request(app.getHttpServer()).get('/api/tenants/me').expect(401);
  });

  afterEach(async () => {
    await app.close();
  });
});

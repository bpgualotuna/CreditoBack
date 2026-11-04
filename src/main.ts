import { Logger, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import cookieParser from 'cookie-parser';
import { AppModule } from './app.module';
import {
  EnvironmentVariables,
  parseOrigins,
} from './context/config/app.config';
import { REFRESH_TOKEN_COOKIE } from './modules/auth/api/cookies/refresh-token-cookie.service';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService<EnvironmentVariables, true>);
  const logger = new Logger('Bootstrap');

  app.setGlobalPrefix('api');

  // --- Security / transport ---
  app.use(cookieParser());
  const allowedOrigins = parseOrigins(
    config.get('FRONTEND_URLS', { infer: true }),
  );
  app.enableCors({
    origin: (
      requestOrigin: string | undefined,
      callback: (err: Error | null, allow?: boolean) => void,
    ) => {
      // Permitir peticiones sin origin (móviles directos, curl, postman)
      if (!requestOrigin) return callback(null, true);
      // Permitir cualquier localhost / 127.0.0.1 con cualquier puerto, capacitor o los configurados
      const isAllowed =
        allowedOrigins.includes(requestOrigin) ||
        /^http:\/\/localhost:\d+$/.test(requestOrigin) ||
        /^http:\/\/127\.0\.0\.1:\d+$/.test(requestOrigin) ||
        requestOrigin.startsWith('capacitor://');

      if (isAllowed) {
        return callback(null, true);
      }
      return callback(
        new Error(`Origen no permitido por CORS: ${requestOrigin}`),
        false,
      );
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-tenant-id'],
  });

  // --- Validation ---
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  // --- Swagger (/api/docs) ---
  const swaggerConfig = new DocumentBuilder()
    .setTitle('CrediFlow API')
    .setDescription('Backend SaaS multi-tenant de CrediFlow')
    .setVersion('1.0')
    .addBearerAuth()
    .addCookieAuth(REFRESH_TOKEN_COOKIE)
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: { persistAuthorization: true },
  });

  app.enableShutdownHooks();

  const port = config.get('PORT', { infer: true });
  await app.listen(port);
  logger.log(`CrediFlow API running on http://localhost:${port}/api`);
  logger.log(`Swagger docs available at http://localhost:${port}/api/docs`);
}

void bootstrap();

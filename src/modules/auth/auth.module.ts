import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { TenantsModule } from '../tenants/tenants.module';
import { AuthController } from './api/controllers/auth.controller';
import { RefreshTokenCookieService } from './api/cookies/refresh-token-cookie.service';
import { AccountStatusService } from './application/services/account-status.service';
import { LoginUseCase } from './application/use-cases/login.use-case';
import { RefreshSessionUseCase } from './application/use-cases/refresh-session.use-case';
import { HasherPort } from './domain/interfaces/hasher.port';
import { TokenServicePort } from './domain/interfaces/token-service.port';
import { UserAuthRepositoryPort } from './domain/interfaces/user-auth.repository.port';
import { BcryptAdapter } from './infrastructure/adapters/bcrypt.adapter';
import { JwtTokenAdapter } from './infrastructure/adapters/jwt-token.adapter';
import { PrismaUserAuthRepository } from './infrastructure/repositories/prisma-user-auth.repository';
import { JwtStrategy } from './infrastructure/strategies/jwt.strategy';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    // Secrets and expirations are provided per-sign in JwtTokenAdapter.
    JwtModule.register({}),
    TenantsModule,
  ],
  controllers: [AuthController],
  providers: [
    // Ports -> adapters
    { provide: HasherPort, useClass: BcryptAdapter },
    { provide: TokenServicePort, useClass: JwtTokenAdapter },
    { provide: UserAuthRepositoryPort, useClass: PrismaUserAuthRepository },
    // Application
    AccountStatusService,
    LoginUseCase,
    RefreshSessionUseCase,
    // Infrastructure / API
    JwtStrategy,
    RefreshTokenCookieService,
  ],
  exports: [HasherPort],
})
export class AuthModule {}

import { Module } from '@nestjs/common';
import { TenantsController } from './api/controllers/tenants.controller';
import { TenantAccessService } from './application/services/tenant-access.service';
import { GetCurrentTenantUseCase } from './application/use-cases/get-current-tenant.use-case';
import { TenantRepositoryPort } from './domain/interfaces/tenant.repository.port';
import { PrismaTenantRepository } from './infrastructure/repositories/prisma-tenant.repository';

@Module({
  controllers: [TenantsController],
  providers: [
    { provide: TenantRepositoryPort, useClass: PrismaTenantRepository },
    TenantAccessService,
    GetCurrentTenantUseCase,
  ],
  exports: [TenantAccessService],
})
export class TenantsModule {}

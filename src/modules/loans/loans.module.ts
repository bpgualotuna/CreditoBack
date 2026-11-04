import { Module } from '@nestjs/common';
import { ClientsModule } from '../clients/clients.module';
import { TenantsModule } from '../tenants/tenants.module';
import { LoansController } from './api/controllers/loans.controller';
import { LoanActorScopeService } from './application/services/loan-actor-scope.service';
import { ApproveLoanUseCase } from './application/use-cases/approve-loan.use-case';
import { GetLoanByIdUseCase } from './application/use-cases/get-loan-by-id.use-case';
import { GetLoansUseCase } from './application/use-cases/get-loans.use-case';
import { RejectLoanUseCase } from './application/use-cases/reject-loan.use-case';
import { RequestLoanUseCase } from './application/use-cases/request-loan.use-case';
import { CollectorDirectoryPort } from './domain/interfaces/collector-directory.port';
import { LoanRepositoryPort } from './domain/interfaces/loan.repository.port';
import { LoanCalculatorService } from './domain/services/loan-calculator.service';
import { PrismaCollectorDirectory } from './infrastructure/repositories/prisma-collector-directory';
import { PrismaLoanRepository } from './infrastructure/repositories/prisma-loan.repository';

@Module({
  imports: [ClientsModule, TenantsModule],
  controllers: [LoansController],
  providers: [
    { provide: LoanRepositoryPort, useClass: PrismaLoanRepository },
    { provide: CollectorDirectoryPort, useClass: PrismaCollectorDirectory },
    LoanCalculatorService,
    LoanActorScopeService,
    RequestLoanUseCase,
    ApproveLoanUseCase,
    RejectLoanUseCase,
    GetLoansUseCase,
    GetLoanByIdUseCase,
  ],
  exports: [LoanRepositoryPort, LoanCalculatorService],
})
export class LoansModule {}

import { Module } from '@nestjs/common';
import { ClientsController } from './api/controllers/clients.controller';
import { CreateClientUseCase } from './application/use-cases/create-client.use-case';
import { GetClientByIdUseCase } from './application/use-cases/get-client-by-id.use-case';
import { GetClientsUseCase } from './application/use-cases/get-clients.use-case';
import { UpdateKycStatusUseCase } from './application/use-cases/update-kyc-status.use-case';
import { ClientRepositoryPort } from './domain/interfaces/client.repository.port';
import { PrismaClientRepository } from './infrastructure/repositories/prisma-client.repository';

@Module({
  controllers: [ClientsController],
  providers: [
    { provide: ClientRepositoryPort, useClass: PrismaClientRepository },
    CreateClientUseCase,
    GetClientsUseCase,
    GetClientByIdUseCase,
    UpdateKycStatusUseCase,
  ],
  // Exposed so other modules (e.g. loans) can validate client ownership.
  exports: [ClientRepositoryPort],
})
export class ClientsModule {}

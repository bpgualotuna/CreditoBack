import {
  BadRequestException,
  ConflictException,
  Injectable,
} from '@nestjs/common';
import { ClientRepositoryPort } from '../../domain/interfaces/client.repository.port';
import type { Client, NewClient } from '../../domain/types/client.type';

export type CreateClientCommand = Omit<NewClient, 'empresaId'>;

/**
 * Registers a new client inside the authenticated tenant. The document number
 * is unique per tenant; the branch (if any) must belong to the same tenant.
 */
@Injectable()
export class CreateClientUseCase {
  constructor(private readonly clientRepository: ClientRepositoryPort) {}

  async execute(
    empresaId: string,
    command: CreateClientCommand,
  ): Promise<Client> {
    const hasLat = command.latitudDomicilio != null;
    const hasLng = command.longitudDomicilio != null;
    if (hasLat !== hasLng) {
      throw new BadRequestException(
        'Las coordenadas del domicilio requieren latitud y longitud',
      );
    }

    const existing = await this.clientRepository.findByDocumento(
      empresaId,
      command.numeroDocumento,
    );
    if (existing) {
      throw new ConflictException(
        `Ya existe un cliente con el documento ${command.numeroDocumento}`,
      );
    }

    if (command.sucursalId) {
      const branchOk = await this.clientRepository.branchBelongsToTenant(
        command.sucursalId,
        empresaId,
      );
      if (!branchOk) {
        throw new BadRequestException(
          'La sucursal indicada no pertenece a la empresa',
        );
      }
    }

    return this.clientRepository.create({ ...command, empresaId });
  }
}

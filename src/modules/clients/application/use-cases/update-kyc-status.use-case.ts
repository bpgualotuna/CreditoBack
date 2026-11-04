import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { TenantScope } from '../../../../common/utils/tenant-scope.util';
import { ClientRepositoryPort } from '../../domain/interfaces/client.repository.port';
import type { Client, KycUpdate } from '../../domain/types/client.type';

/**
 * Updates the eKYC file of a client: biometric match percentage, document
 * URLs (merged with the existing ones) and verification status.
 */
@Injectable()
export class UpdateKycStatusUseCase {
  constructor(private readonly clientRepository: ClientRepositoryPort) {}

  async execute(
    id: string,
    scope: TenantScope,
    update: KycUpdate,
  ): Promise<Client> {
    const current = await this.clientRepository.findById(id, scope);

    if (!current) {
      throw new NotFoundException('Cliente no encontrado');
    }

    const porcentajeBiometria =
      update.porcentajeBiometria ?? current.porcentajeBiometria;

    if (update.kycEstado === 'verificado' && !porcentajeBiometria) {
      throw new BadRequestException(
        'Para marcar el cliente como verificado se requiere porcentajeBiometria',
      );
    }

    const documentosUrls = update.documentosUrls
      ? { ...current.documentosUrls, ...update.documentosUrls }
      : undefined;

    const updated = await this.clientRepository.updateKycStatus(id, scope, {
      kycEstado: update.kycEstado,
      porcentajeBiometria: update.porcentajeBiometria,
      documentosUrls,
    });

    if (!updated) {
      throw new NotFoundException('Cliente no encontrado');
    }

    return updated;
  }
}

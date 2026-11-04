import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import type { ClientRepositoryPort } from '../../domain/interfaces/client.repository.port';
import type { Client, ClientDetail } from '../../domain/types/client.type';
import { CreateClientUseCase } from './create-client.use-case';
import { GetClientByIdUseCase } from './get-client-by-id.use-case';
import { UpdateKycStatusUseCase } from './update-kyc-status.use-case';

const TENANT_A = '11111111-1111-4111-8111-111111111111';

function buildClient(overrides: Partial<Client> = {}): Client {
  return {
    id: '22222222-2222-4222-8222-222222222222',
    empresaId: TENANT_A,
    sucursalId: null,
    usuarioId: null,
    numeroDocumento: '1032456789',
    tipoDocumento: 'CC',
    nombres: 'Maria',
    apellidos: 'Lopez',
    telefono: '+573001234567',
    whatsapp: null,
    email: null,
    direccion: 'Cra 15 # 45-20',
    barrioZona: 'Chapinero',
    latitudDomicilio: 4.6486,
    longitudDomicilio: -74.0628,
    kycEstado: 'pendiente',
    porcentajeBiometria: null,
    scoreCrediticio: 680,
    calificacionEstrellas: 3.5,
    documentosUrls: {},
    createdAt: new Date('2026-11-04T00:00:00Z'),
    updatedAt: new Date('2026-11-04T00:00:00Z'),
    ...overrides,
  };
}

describe('Clients Use Cases', () => {
  let repo: jest.Mocked<ClientRepositoryPort>;

  beforeEach(() => {
    repo = {
      create: jest.fn(),
      findById: jest.fn(),
      findByDocumento: jest.fn(),
      findByUsuarioId: jest.fn(),
      findAll: jest.fn(),
      updateKycStatus: jest.fn(),
      branchBelongsToTenant: jest.fn(),
    };
  });

  describe('CreateClientUseCase', () => {
    it('creates a client scoped to the current tenant', async () => {
      const useCase = new CreateClientUseCase(repo);
      const created = buildClient();
      repo.findByDocumento.mockResolvedValue(null);
      repo.create.mockResolvedValue(created);

      const result = await useCase.execute(TENANT_A, {
        numeroDocumento: '1032456789',
        nombres: 'Maria',
        telefono: '+573001234567',
        direccion: 'Cra 15 # 45-20',
        latitudDomicilio: 4.6486,
        longitudDomicilio: -74.0628,
      });

      expect(repo.findByDocumento.mock.calls).toContainEqual([
        TENANT_A,
        '1032456789',
      ]);
      expect(result).toEqual(created);
    });

    it('rejects duplicate document within the same tenant', async () => {
      const useCase = new CreateClientUseCase(repo);
      repo.findByDocumento.mockResolvedValue(buildClient());

      await expect(
        useCase.execute(TENANT_A, {
          numeroDocumento: '1032456789',
          nombres: 'Maria',
          telefono: '+573001234567',
          direccion: 'Cra 15 # 45-20',
        }),
      ).rejects.toThrow(ConflictException);
    });

    it('rejects partial coordinates (lat without lng)', async () => {
      const useCase = new CreateClientUseCase(repo);

      await expect(
        useCase.execute(TENANT_A, {
          numeroDocumento: '1032456789',
          nombres: 'Maria',
          telefono: '+573001234567',
          direccion: 'Cra 15 # 45-20',
          latitudDomicilio: 4.6486,
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('GetClientByIdUseCase & UpdateKycStatusUseCase', () => {
    it('throws NotFoundException when client belongs to another tenant', async () => {
      const getById = new GetClientByIdUseCase(repo);
      repo.findById.mockResolvedValue(null);

      await expect(getById.execute('client-id', TENANT_A)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('requires porcentajeBiometria when setting kycEstado to verificado', async () => {
      const updateKyc = new UpdateKycStatusUseCase(repo);
      const detail: ClientDetail = {
        ...buildClient(),
        sucursalNombre: null,
        prestamos: [],
      };
      repo.findById.mockResolvedValue(detail);

      await expect(
        updateKyc.execute(detail.id, TENANT_A, { kycEstado: 'verificado' }),
      ).rejects.toThrow(BadRequestException);
    });
  });
});

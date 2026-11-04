import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiHeader,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentTenant, Roles } from '../../../../common/decorators';
import { toPaginatedResponse } from '../../../../common/dtos/pagination-meta.dto';
import { TENANT_HEADER } from '../../../../common/guards/tenant.guard';
import {
  requireTenantId,
  type TenantScope,
} from '../../../../common/utils/tenant-scope.util';
import { CreateClientUseCase } from '../../application/use-cases/create-client.use-case';
import { GetClientByIdUseCase } from '../../application/use-cases/get-client-by-id.use-case';
import { GetClientsUseCase } from '../../application/use-cases/get-clients.use-case';
import { UpdateKycStatusUseCase } from '../../application/use-cases/update-kyc-status.use-case';
import { ClientQueryDto } from '../dtos/client-query.dto';
import {
  ClientDetailResponseDto,
  ClientResponseDto,
  PaginatedClientsResponseDto,
} from '../dtos/client-response.dto';
import { CreateClientDto } from '../dtos/create-client.dto';
import { UpdateKycDto } from '../dtos/update-kyc.dto';

@ApiTags('Clients')
@ApiBearerAuth()
@ApiHeader({
  name: TENANT_HEADER,
  required: false,
  description: 'Solo superadmin: empresa sobre la que se opera',
})
@ApiForbiddenResponse({ description: 'Rol no autorizado o empresa ajena' })
@Roles('superadmin', 'admin', 'supervisor', 'cobrador')
@Controller('clients')
export class ClientsController {
  constructor(
    private readonly createClient: CreateClientUseCase,
    private readonly getClients: GetClientsUseCase,
    private readonly getClientById: GetClientByIdUseCase,
    private readonly updateKycStatus: UpdateKycStatusUseCase,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Registrar un cliente en la empresa autenticada' })
  @ApiCreatedResponse({ type: ClientResponseDto })
  @ApiConflictResponse({ description: 'Documento ya registrado en la empresa' })
  @ApiBadRequestResponse({ description: 'Datos invalidos' })
  async create(
    @CurrentTenant() scope: TenantScope,
    @Body() dto: CreateClientDto,
  ): Promise<ClientResponseDto> {
    const client = await this.createClient.execute(requireTenantId(scope), dto);
    return ClientResponseDto.fromDomain(client);
  }

  @Get()
  @ApiOperation({ summary: 'Listar clientes con filtros y paginacion' })
  @ApiOkResponse({ type: PaginatedClientsResponseDto })
  async findAll(
    @CurrentTenant() scope: TenantScope,
    @Query() query: ClientQueryDto,
  ): Promise<PaginatedClientsResponseDto> {
    const result = await this.getClients.execute(scope, query);
    return toPaginatedResponse(result, (client) =>
      ClientResponseDto.fromDomain(client),
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Expediente completo del cliente' })
  @ApiOkResponse({ type: ClientDetailResponseDto })
  @ApiNotFoundResponse({ description: 'Cliente no encontrado' })
  async findOne(
    @CurrentTenant() scope: TenantScope,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ClientDetailResponseDto> {
    const detail = await this.getClientById.execute(id, scope);
    return ClientDetailResponseDto.fromDetail(detail);
  }

  @Patch(':id/kyc')
  @Roles('superadmin', 'admin', 'supervisor')
  @ApiOperation({ summary: 'Actualizar verificacion eKYC del cliente' })
  @ApiOkResponse({ type: ClientResponseDto })
  @ApiNotFoundResponse({ description: 'Cliente no encontrado' })
  async updateKyc(
    @CurrentTenant() scope: TenantScope,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateKycDto,
  ): Promise<ClientResponseDto> {
    const client = await this.updateKycStatus.execute(id, scope, {
      kycEstado: dto.kycEstado,
      porcentajeBiometria: dto.porcentajeBiometria,
      documentosUrls: dto.documentosUrls
        ? { ...dto.documentosUrls }
        : undefined,
    });
    return ClientResponseDto.fromDomain(client);
  }
}

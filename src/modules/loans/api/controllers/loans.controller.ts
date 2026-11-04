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
import {
  CurrentTenant,
  CurrentUser,
  Roles,
} from '../../../../common/decorators';
import { toPaginatedResponse } from '../../../../common/dtos/pagination-meta.dto';
import { TENANT_HEADER } from '../../../../common/guards/tenant.guard';
import type { AuthenticatedUser } from '../../../../common/interfaces/authenticated-request.interface';
import { parseDateOnly } from '../../../../common/utils/date.util';
import {
  requireTenantId,
  type TenantScope,
} from '../../../../common/utils/tenant-scope.util';
import { ApproveLoanUseCase } from '../../application/use-cases/approve-loan.use-case';
import { GetLoanByIdUseCase } from '../../application/use-cases/get-loan-by-id.use-case';
import { GetLoansUseCase } from '../../application/use-cases/get-loans.use-case';
import { RejectLoanUseCase } from '../../application/use-cases/reject-loan.use-case';
import { RequestLoanUseCase } from '../../application/use-cases/request-loan.use-case';
import { ApproveLoanDto } from '../dtos/approve-loan.dto';
import { LoanQueryDto } from '../dtos/loan-query.dto';
import {
  LoanDetailResponseDto,
  LoanResponseDto,
  PaginatedLoansResponseDto,
} from '../dtos/loan-response.dto';
import { RejectLoanDto } from '../dtos/reject-loan.dto';
import { RequestLoanDto } from '../dtos/request-loan.dto';

@ApiTags('Loans')
@ApiBearerAuth()
@ApiHeader({
  name: TENANT_HEADER,
  required: false,
  description: 'Solo superadmin: empresa sobre la que se opera',
})
@ApiForbiddenResponse({ description: 'Rol no autorizado o empresa ajena' })
@Controller('loans')
export class LoansController {
  constructor(
    private readonly requestLoan: RequestLoanUseCase,
    private readonly approveLoan: ApproveLoanUseCase,
    private readonly rejectLoan: RejectLoanUseCase,
    private readonly getLoans: GetLoansUseCase,
    private readonly getLoanById: GetLoanByIdUseCase,
  ) {}

  @Post('request')
  @ApiOperation({ summary: 'Solicitar un credito en estado Pendiente' })
  @ApiCreatedResponse({ type: LoanResponseDto })
  @ApiBadRequestResponse({ description: 'Datos invalidos' })
  @ApiNotFoundResponse({ description: 'Cliente no encontrado' })
  async request(
    @CurrentTenant() scope: TenantScope,
    @CurrentUser() actor: AuthenticatedUser,
    @Body() dto: RequestLoanDto,
  ): Promise<LoanResponseDto> {
    const loan = await this.requestLoan.execute(
      requireTenantId(scope),
      actor,
      dto,
    );
    return LoanResponseDto.fromDomain(loan);
  }

  @Get()
  @ApiOperation({ summary: 'Listar cartera de prestamos con filtros' })
  @ApiOkResponse({ type: PaginatedLoansResponseDto })
  async findAll(
    @CurrentTenant() scope: TenantScope,
    @CurrentUser() actor: AuthenticatedUser,
    @Query() query: LoanQueryDto,
  ): Promise<PaginatedLoansResponseDto> {
    const result = await this.getLoans.execute(scope, actor, query);
    return toPaginatedResponse(result, (loan) =>
      LoanResponseDto.fromDomain(loan),
    );
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Detalle financiero completo del prestamo con cuotas y saldo',
  })
  @ApiOkResponse({ type: LoanDetailResponseDto })
  @ApiNotFoundResponse({ description: 'Prestamo no encontrado' })
  async findOne(
    @CurrentTenant() scope: TenantScope,
    @CurrentUser() actor: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<LoanDetailResponseDto> {
    const detail = await this.getLoanById.execute(id, scope, actor);
    return LoanDetailResponseDto.fromDetail(detail);
  }

  @Patch(':id/approve')
  @Roles('superadmin', 'admin', 'supervisor')
  @ApiOperation({ summary: 'Aprobar solicitud de credito y pasar a Activo' })
  @ApiOkResponse({ type: LoanDetailResponseDto })
  @ApiConflictResponse({
    description: 'El prestamo no esta en estado Pendiente',
  })
  @ApiNotFoundResponse({ description: 'Prestamo no encontrado' })
  async approve(
    @CurrentTenant() scope: TenantScope,
    @CurrentUser() actor: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ApproveLoanDto,
  ): Promise<LoanDetailResponseDto> {
    const detail = await this.approveLoan.execute(id, scope, {
      approverUserId: actor.id,
      montoAprobado: dto.montoAprobado,
      cobradorId: dto.cobradorId,
      fechaDesembolso: dto.fechaDesembolso
        ? parseDateOnly(dto.fechaDesembolso)
        : undefined,
    });
    return LoanDetailResponseDto.fromDetail(detail);
  }

  @Patch(':id/reject')
  @Roles('superadmin', 'admin', 'supervisor')
  @ApiOperation({ summary: 'Rechazar solicitud de credito con motivo' })
  @ApiOkResponse({ type: LoanResponseDto })
  @ApiConflictResponse({
    description: 'El prestamo no esta en estado Pendiente',
  })
  @ApiNotFoundResponse({ description: 'Prestamo no encontrado' })
  async reject(
    @CurrentTenant() scope: TenantScope,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: RejectLoanDto,
  ): Promise<LoanResponseDto> {
    const loan = await this.rejectLoan.execute(id, scope, dto.motivoRechazo);
    return LoanResponseDto.fromDomain(loan);
  }
}

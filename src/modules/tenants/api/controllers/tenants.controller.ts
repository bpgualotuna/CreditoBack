import { Controller, Get } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { CurrentTenant } from '../../../../common/decorators';
import { GetCurrentTenantUseCase } from '../../application/use-cases/get-current-tenant.use-case';
import { TenantResponseDto } from '../dtos/tenant-response.dto';

@ApiTags('Tenants')
@ApiBearerAuth()
@Controller('tenants')
export class TenantsController {
  constructor(private readonly getCurrentTenant: GetCurrentTenantUseCase) {}

  @Get('me')
  @ApiOkResponse({ type: TenantResponseDto })
  async me(
    @CurrentTenant() empresaId: string | null,
  ): Promise<TenantResponseDto> {
    const tenant = await this.getCurrentTenant.execute(empresaId);
    return TenantResponseDto.fromDomain(tenant);
  }
}

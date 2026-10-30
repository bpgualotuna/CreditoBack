import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCookieAuth,
  ApiForbiddenResponse,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import type { Request, Response } from 'express';
import { CurrentUser, Public } from '../../../../common/decorators';
import type { AuthenticatedUser } from '../../../../common/interfaces/authenticated-request.interface';
import { LoginUseCase } from '../../application/use-cases/login.use-case';
import { RefreshSessionUseCase } from '../../application/use-cases/refresh-session.use-case';
import {
  REFRESH_TOKEN_COOKIE,
  RefreshTokenCookieService,
} from '../cookies/refresh-token-cookie.service';
import { AuthResponseDto } from '../dtos/auth-response.dto';
import { LoginDto } from '../dtos/login.dto';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly loginUseCase: LoginUseCase,
    private readonly refreshSessionUseCase: RefreshSessionUseCase,
    private readonly refreshCookie: RefreshTokenCookieService,
  ) {}

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({
    type: AuthResponseDto,
    description: `Access token en el body; refresh token en cookie httpOnly "${REFRESH_TOKEN_COOKIE}"`,
  })
  @ApiUnauthorizedResponse({ description: 'Credenciales invalidas' })
  @ApiForbiddenResponse({ description: 'Usuario o empresa inactivos' })
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) response: Response,
  ): Promise<AuthResponseDto> {
    const session = await this.loginUseCase.execute(dto);
    this.refreshCookie.set(
      response,
      session.tokens.refreshToken,
      session.tokens.refreshTokenMaxAgeMs,
    );
    return AuthResponseDto.fromSession(session);
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiCookieAuth(REFRESH_TOKEN_COOKIE)
  @ApiOkResponse({ type: AuthResponseDto })
  @ApiUnauthorizedResponse({ description: 'Refresh token invalido o expirado' })
  async refresh(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ): Promise<AuthResponseDto> {
    try {
      const session = await this.refreshSessionUseCase.execute(
        this.refreshCookie.read(request),
      );
      this.refreshCookie.set(
        response,
        session.tokens.refreshToken,
        session.tokens.refreshTokenMaxAgeMs,
      );
      return AuthResponseDto.fromSession(session);
    } catch (error) {
      this.refreshCookie.clear(response);
      throw error;
    }
  }

  @Public()
  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiNoContentResponse({ description: 'Cookie de refresh eliminada' })
  logout(@Res({ passthrough: true }) response: Response): void {
    this.refreshCookie.clear(response);
  }

  @Get('me')
  @ApiBearerAuth()
  @ApiOkResponse({ description: 'Claims del usuario autenticado' })
  me(@CurrentUser() user: AuthenticatedUser): AuthenticatedUser {
    return user;
  }
}

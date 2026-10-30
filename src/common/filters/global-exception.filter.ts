import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import type { Request, Response } from 'express';

export interface ErrorResponseBody {
  statusCode: number;
  error: string;
  message: string | string[];
  path: string;
  method: string;
  timestamp: string;
}

interface MappedError {
  status: number;
  message: string | string[];
}

/**
 * Standardizes every error response (HTTP, validation, Prisma and unknown).
 */
@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const { status, message } = this.mapException(exception);

    if (status >= Number(HttpStatus.INTERNAL_SERVER_ERROR)) {
      this.logger.error(
        `${request.method} ${request.url} -> ${status}`,
        exception instanceof Error ? exception.stack : String(exception),
      );
    }

    const body: ErrorResponseBody = {
      statusCode: status,
      error: HttpStatus[status] ?? 'Error',
      message,
      path: request.url,
      method: request.method,
      timestamp: new Date().toISOString(),
    };

    response.status(status).json(body);
  }

  private mapException(exception: unknown): MappedError {
    if (exception instanceof HttpException) {
      return this.mapHttpException(exception);
    }

    if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      return this.mapPrismaKnownError(exception);
    }

    if (exception instanceof Prisma.PrismaClientValidationError) {
      return {
        status: HttpStatus.BAD_REQUEST,
        message: 'Datos invalidos para la operacion solicitada',
      };
    }

    if (exception instanceof Prisma.PrismaClientInitializationError) {
      return {
        status: HttpStatus.SERVICE_UNAVAILABLE,
        message: 'Base de datos no disponible',
      };
    }

    return {
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      message: 'Error interno del servidor',
    };
  }

  private mapHttpException(exception: HttpException): MappedError {
    const status = exception.getStatus();
    const payload = exception.getResponse();

    if (typeof payload === 'string') {
      return { status, message: payload };
    }

    const { message } = payload as { message?: string | string[] };
    return { status, message: message ?? exception.message };
  }

  private mapPrismaKnownError(
    exception: Prisma.PrismaClientKnownRequestError,
  ): MappedError {
    switch (exception.code) {
      case 'P2002': {
        const target =
          (exception.meta?.target as string[] | string | undefined) ?? '';
        const fields = Array.isArray(target) ? target.join(', ') : target;
        return {
          status: HttpStatus.CONFLICT,
          message: fields
            ? `Ya existe un registro con el mismo valor en: ${fields}`
            : 'Ya existe un registro con los mismos datos unicos',
        };
      }
      case 'P2003':
        return {
          status: HttpStatus.CONFLICT,
          message: 'La operacion viola una relacion entre registros',
        };
      case 'P2025':
        return {
          status: HttpStatus.NOT_FOUND,
          message: 'Registro no encontrado',
        };
      case 'P2000':
        return {
          status: HttpStatus.BAD_REQUEST,
          message: 'Un valor excede la longitud permitida',
        };
      default:
        return {
          status: HttpStatus.INTERNAL_SERVER_ERROR,
          message: 'Error de base de datos',
        };
    }
  }
}

import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../context/database/prisma.service';
import { UserAuthRepositoryPort } from '../../domain/interfaces/user-auth.repository.port';
import type { AuthUser } from '../../domain/types/auth-user.type';

const AUTH_USER_SELECT = {
  id: true,
  email: true,
  passwordHash: true,
  nombreCompleto: true,
  rol: true,
  estaActivo: true,
  empresaId: true,
  sucursalId: true,
  avatarUrl: true,
} as const;

@Injectable()
export class PrismaUserAuthRepository implements UserAuthRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  findByEmail(email: string): Promise<AuthUser | null> {
    return this.prisma.usuario.findUnique({
      where: { email: email.trim().toLowerCase() },
      select: AUTH_USER_SELECT,
    });
  }

  findById(id: string): Promise<AuthUser | null> {
    return this.prisma.usuario.findUnique({
      where: { id },
      select: AUTH_USER_SELECT,
    });
  }
}

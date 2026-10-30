import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type {
  AuthenticatedRequest,
  AuthenticatedUser,
} from '../interfaces/authenticated-request.interface';

/**
 * Injects the authenticated user (or one of its properties).
 * @example `me(@CurrentUser() user: AuthenticatedUser)`
 * @example `me(@CurrentUser('id') userId: string)`
 */
export const CurrentUser = createParamDecorator(
  (property: keyof AuthenticatedUser | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<AuthenticatedRequest>();
    const user = request.user;
    return property ? user?.[property] : user;
  },
);

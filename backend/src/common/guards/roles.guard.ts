import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { PERMISSIONS_KEY } from '../decorators/permissions.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredRoles && !requiredPermissions) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('AUTH_FORBIDDEN');
    }

    if (requiredRoles) {
      const hasRole = user.roles?.some((role: string) =>
        requiredRoles.includes(role),
      );
      if (!hasRole) {
        throw new ForbiddenException('AUTH_FORBIDDEN');
      }
    }

    if (requiredPermissions) {
      const hasPermission = user.permissions?.some((perm: string) =>
        requiredPermissions.includes(perm),
      );
      if (!hasPermission) {
        throw new ForbiddenException('AUTH_FORBIDDEN');
      }
    }

    return true;
  }
}

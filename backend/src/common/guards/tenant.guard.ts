import {
  Injectable,
  CanActivate,
  ExecutionContext,
  BadRequestException,
} from '@nestjs/common';

@Injectable()
export class TenantGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user || !user.orgId) {
      throw new BadRequestException('ORG_ID_REQUIRED');
    }

    request.headers['x-org-id'] = user.orgId;

    return true;
  }
}

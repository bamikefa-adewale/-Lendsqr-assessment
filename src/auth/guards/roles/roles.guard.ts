import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { REQUEST_USER_KEY } from '../../constants/auth.constant';
import { ROLES_KEY } from '../../decorators/roles.decorator';
import { UserRole } from '../../../enums/user-role.enum';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    // If no roles are required, allow access
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const payload = request[REQUEST_USER_KEY];

    if (!payload || !payload.sub) {
      throw new ForbiddenException('User not authenticated');
    }

    try {
      return true;
    } catch (error) {
      throw new ForbiddenException('Error validating user permissions');
    }
  }
}

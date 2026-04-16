import { SetMetadata } from '@nestjs/common';
import { AuthType } from '../enums/auth-types.enum';
import { AUTH_TYPE_KEY } from '../constants/auth.constant';

export const Auth = (...authType: AuthType[]) =>
  SetMetadata(AUTH_TYPE_KEY, authType);

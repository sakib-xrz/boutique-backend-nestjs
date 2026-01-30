import { SetMetadata } from '@nestjs/common';

export const AUTH_METADATA_KEY = 'auth';
export enum AuthType {
  BEARER = 'bearer',
  NONE = 'none',
}

export const Auth = (...authType: AuthType[]) =>
  SetMetadata(AUTH_METADATA_KEY, authType);

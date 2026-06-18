import { SetMetadata } from '@nestjs/common';

export const SCOPES_KEY = 'api_key_scopes';
export const RequiredScopes = (...scopes: string[]) => SetMetadata(SCOPES_KEY, scopes);

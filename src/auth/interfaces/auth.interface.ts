export interface AuthenticatedUser {
  sub: string;
  id: string;
  email: string;
  name: string;
  role: string;
}

export interface TokenPayload {
  sub: string;
  email: string;
  role: string;
}

export interface AuthTokens {
  access_token: string;
  refresh_token: string;
}

export interface AuthResponse extends AuthTokens {
  user: {
    id: string;
    email: string;
    name: string;
    role: string;
    created_at?: Date;
  };
}

export interface JwtPayload extends TokenPayload {
  type: 'access' | 'refresh';
  iat?: number;
  exp?: number;
  aud?: string;
  iss?: string;
}

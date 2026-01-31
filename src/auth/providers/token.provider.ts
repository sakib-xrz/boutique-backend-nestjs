import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as crypto from 'crypto';

export interface TokenPayload {
  sub: string;
  email: string;
  role: string;
}

@Injectable()
export class TokenProvider {
  constructor(
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
  ) {}

  public generateAccessToken(payload: TokenPayload): string {
    return this.jwtService.sign(
      { ...payload, type: 'access' },
      {
        secret: this.configService.get<string>('JWT_SECRET'),
        audience: this.configService.get<string>('JWT_TOKEN_AUDIENCE'),
        issuer: this.configService.get<string>('JWT_TOKEN_ISSUER'),
        expiresIn: parseInt(
          this.configService.get<string>('JWT_ACCESS_TOKEN_TTL') ?? '3600',
        ),
      },
    );
  }

  public generateRefreshToken(payload: TokenPayload): string {
    return this.jwtService.sign(
      { ...payload, type: 'refresh' },
      {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
        audience: this.configService.get<string>('JWT_TOKEN_AUDIENCE'),
        issuer: this.configService.get<string>('JWT_TOKEN_ISSUER'),
        expiresIn: parseInt(
          this.configService.get<string>('JWT_REFRESH_TOKEN_TTL') ?? '604800',
        ),
      },
    );
  }

  public verifyRefreshToken(token: string): TokenPayload & { type: string } {
    return this.jwtService.verify(token, {
      secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      audience: this.configService.get<string>('JWT_TOKEN_AUDIENCE'),
      issuer: this.configService.get<string>('JWT_TOKEN_ISSUER'),
    }) as TokenPayload & { type: string };
  }

  public hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }
}

import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as crypto from 'crypto';
import { UsersService } from 'src/users/providers/users.service';

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
    private readonly usersService: UsersService,
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

  public async generateTokens(payload: TokenPayload) {
    const access_token = this.generateAccessToken(payload);
    const refresh_token = this.generateRefreshToken(payload);

    const hashedRefreshToken = this.hashToken(refresh_token);
    await this.usersService.updateRefreshToken(payload.sub, hashedRefreshToken);

    return {
      access_token,
      refresh_token,
    };
  }
}

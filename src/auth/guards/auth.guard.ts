import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { UsersService } from 'src/users/providers/users.service';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly usersService: UsersService,
    private readonly reflector: Reflector,
  ) {}
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest();

    const token = this.extractHeaderFromHeader(request);

    if (!token) {
      throw new UnauthorizedException('No token provided');
    }

    try {
      const payload = await this.jwtService.verifyAsync(token, {
        secret: this.configService.get<string>('JWT_SECRET'),
        audience: this.configService.get<string>('JWT_TOKEN_AUDIENCE'),
        issuer: this.configService.get<string>('JWT_TOKEN_ISSUER'),
      });

      // Ensure this is an access token, not a refresh token
      if (payload.type === 'refresh') {
        throw new UnauthorizedException('Invalid token type');
      }

      const user = await this.usersService.findUserByEmail(payload.email);

      if (!user) {
        throw new UnauthorizedException('User no longer exists');
      }

      if (user.is_active === false) {
        throw new UnauthorizedException('User account is deactivated');
      }

      if (user.is_deleted === true) {
        throw new UnauthorizedException('User account is deleted');
      }

      const requestUser = {
        sub: user.id,
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      };

      request['user'] = requestUser;
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new UnauthorizedException('Invalid or expired token');
    }

    return true;
  }

  private extractHeaderFromHeader(request: Request): string | undefined {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [_, token] = request.headers.authorization?.split(' ') ?? [];

    return token;
  }
}

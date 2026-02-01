import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './providers/auth.service';
import { UsersModule } from 'src/users/users.module';
import { ConfigService } from '@nestjs/config';
import { BcryptProvider } from './providers/bcrypt.provider';
import { TokenProvider } from './providers/token.provider';
import { JwtModule } from '@nestjs/jwt';
import { GoogleAuthenticationController } from './social/google-authentication.controller';
import { GoogleAuthenticationService } from './social/providers/google-authentication.service';

@Module({
  imports: [
    UsersModule,
    JwtModule.registerAsync({
      global: true,
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: {
          expiresIn: parseInt(
            configService.get<string>('JWT_ACCESS_TOKEN_TTL') ?? '3600',
          ),
        },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [AuthController, GoogleAuthenticationController],
  providers: [
    ConfigService,
    AuthService,
    BcryptProvider,
    TokenProvider,
    GoogleAuthenticationService,
  ],
})
export class AuthModule {}

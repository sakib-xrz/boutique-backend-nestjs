import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './providers/auth.service';
import { PrismaService } from 'src/prisma.service';
import { UsersModule } from 'src/users/users.module';
import { ConfigService } from '@nestjs/config';
import { BcryptProvider } from './providers/bcrypt.provider';
import { JwtModule } from '@nestjs/jwt';

@Module({
  controllers: [AuthController],
  providers: [ConfigService, PrismaService, AuthService, BcryptProvider],
  imports: [
    UsersModule,
    JwtModule.registerAsync({
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        global: true,
        signOptions: {
          expiresIn: parseInt(
            configService.get<string>('JWT_ACCESS_TOKEN_TTL') ?? '3600',
          ),
        },
      }),
      inject: [ConfigService],
    }),
  ],
})
export class AuthModule {}

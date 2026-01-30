import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './providers/auth.service';
import { UsersModule } from 'src/users/users.module';
import { ConfigService } from '@nestjs/config';
import { BcryptProvider } from './providers/bcrypt.provider';

@Module({
  controllers: [AuthController],
  providers: [ConfigService, AuthService, BcryptProvider],
  imports: [UsersModule],
})
export class AuthModule {}

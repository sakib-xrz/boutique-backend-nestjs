import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { PrismaService } from 'src/prisma.service';
import { UsersModule } from 'src/users/users.module';
import { ConfigService } from '@nestjs/config';

@Module({
  controllers: [AuthController],
  providers: [AuthService, PrismaService, ConfigService],
  imports: [UsersModule],
})
export class AuthModule {}

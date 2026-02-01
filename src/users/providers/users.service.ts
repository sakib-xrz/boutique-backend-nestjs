import { PrismaService } from 'src/prisma/prisma.service';
import { CreateUserDto } from '../../auth/dtos/create-user.dto';
import { Injectable } from '@nestjs/common';
import { CreateGoogleUserDto } from 'src/auth/social/dtos/create-google-user.dto';

@Injectable()
export class UsersService {
  constructor(private readonly prismaService: PrismaService) {}

  async findUserByEmail(email: string) {
    return this.prismaService.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        password: true,
        name: true,
        role: true,
        is_deleted: true,
        created_at: true,
      },
    });
  }

  async findByGoogleId(googleId: string) {
    return this.prismaService.user.findFirst({
      where: { google_id: googleId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        is_deleted: true,
        created_at: true,
      },
    });
  }

  async findByRefreshToken(token: string) {
    return this.prismaService.user.findFirst({
      where: { refresh_token: token },
      select: {
        id: true,
        email: true,
        password: true,
        name: true,
        role: true,
        is_deleted: true,
        created_at: true,
      },
    });
  }

  async createUser(createUserDto: CreateUserDto) {
    const { name, email, password } = createUserDto;
    const user = await this.prismaService.user.create({
      data: {
        name,
        email,
        password,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        created_at: true,
      },
    });

    return user;
  }

  async createGoogleUser(createGoogleUserDto: CreateGoogleUserDto) {
    const { name, email, googleId } = createGoogleUserDto;

    const user = await this.prismaService.user.create({
      data: {
        name,
        email,
        google_id: googleId,
        image_url: createGoogleUserDto?.imageUrl || null,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        created_at: true,
      },
    });

    return user;
  }

  async updateRefreshToken(userId: string, refreshToken: string) {
    return this.prismaService.user.update({
      where: { id: userId },
      data: { refresh_token: refreshToken },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        created_at: true,
      },
    });
  }

  async revokeRefreshToken(userId: string) {
    return this.prismaService.user.update({
      where: { id: userId },
      data: { refresh_token: null },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        created_at: true,
      },
    });
  }
}

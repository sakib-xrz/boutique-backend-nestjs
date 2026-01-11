import { CreateUserDto } from './../auth/dtos/create-user.dto';
import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';

@Injectable()
export class UsersService {
  constructor(private readonly prismaService: PrismaService) {}

  async findUserByEmail(email: string) {
    return this.prismaService.user.findUnique({
      where: { email },
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
        email_verified: true,
        created_at: true,
      },
    });

    return user;
  }
}

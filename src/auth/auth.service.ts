import * as bcrypt from 'bcrypt';
import { ConflictException, Injectable } from '@nestjs/common';
import { CreateUserDto } from './dtos/create-user.dto';
import { UsersService } from 'src/users/users.service';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly configService: ConfigService,
  ) {}
  async register(createUserDto: CreateUserDto) {
    const { email, password, name } = createUserDto;

    const existingUser = await this.usersService.findUserByEmail(email);

    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    const saltRounds = this.configService.get<number>('BCRYPT_SALT_ROUNDS');
    console.log('Bcrypt salt round', saltRounds);

    const hashedPassword = await bcrypt.hash(password, Number(saltRounds));

    const user = await this.usersService.createUser({
      email,
      password: hashedPassword,
      name,
    });

    return {
      message: 'User registered successfully',
      data: user,
    };
  }
}

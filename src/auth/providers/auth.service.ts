import { ConflictException, Injectable } from '@nestjs/common';
import { CreateUserDto } from '../dtos/create-user.dto';
import { UsersService } from 'src/users/providers/users.service';
import { JwtService } from '@nestjs/jwt/dist/jwt.service';
import { ConfigService } from '@nestjs/config';
import { BcryptProvider } from './bcrypt.provider';
import { LoginDto } from '../dtos/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly configService: ConfigService,
    private readonly bcryptProvider: BcryptProvider,
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async register(createUserDto: CreateUserDto) {
    const { email, password, name } = createUserDto;

    const existingUser = await this.usersService.findUserByEmail(email);

    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }
    const hashedPassword = await this.bcryptProvider.hashPassword(password);

    const user = await this.usersService.createUser({
      email,
      password: hashedPassword,
      name,
    });

    const payload = { sub: user.id, email: user.email };

    const access_token = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('JWT_SECRET'),
      audience: this.configService.get<string>('JWT_TOKEN_AUDIENCE'),
      issuer: this.configService.get<string>('JWT_TOKEN_ISSUER'),
      expiresIn: parseInt(
        this.configService.get<string>('JWT_ACCESS_TOKEN_TTL') ?? '3600',
      ),
    });

    return {
      access_token,
      user,
    };
  }

  async login(loginDto: LoginDto) {
    const { email, password } = loginDto;

    const user = await this.usersService.findUserByEmail(email);

    if (!user) {
      return {
        message: 'Invalid email or password',
      };
    }

    const isPasswordValid = await this.bcryptProvider.comparePassword(
      password,
      user.password,
    );

    if (!isPasswordValid) {
      return {
        message: 'Invalid email or password',
      };
    }

    const payload = { sub: user.id, email: user.email };

    const access_token = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('JWT_SECRET'),
      audience: this.configService.get<string>('JWT_TOKEN_AUDIENCE'),
      issuer: this.configService.get<string>('JWT_TOKEN_ISSUER'),
      expiresIn: parseInt(
        this.configService.get<string>('JWT_ACCESS_TOKEN_TTL') ?? '3600',
      ),
    });

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password: _, ...userWithoutPassword } = user;

    return {
      access_token,
      user: userWithoutPassword,
    };
  }
}

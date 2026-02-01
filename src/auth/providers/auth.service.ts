import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { CreateUserDto } from '../dtos/create-user.dto';
import { UsersService } from 'src/users/providers/users.service';
import { BcryptProvider } from './bcrypt.provider';
import { TokenProvider } from './token.provider';
import { LoginDto } from '../dtos/login.dto';
import { RefreshTokenDto } from '../dtos/refresh-token.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly bcryptProvider: BcryptProvider,
    private readonly tokenProvider: TokenProvider,
    private readonly usersService: UsersService,
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

    const payload = { sub: user.id, email: user.email, role: user.role };

    const access_token = this.tokenProvider.generateAccessToken(payload);
    const refresh_token = this.tokenProvider.generateRefreshToken(payload);

    const hashedRefreshToken = this.tokenProvider.hashToken(refresh_token);
    await this.usersService.updateRefreshToken(user.id, hashedRefreshToken);

    return {
      access_token,
      refresh_token,
      user,
    };
  }

  async login(loginDto: LoginDto) {
    const { email, password } = loginDto;

    const user = await this.usersService.findUserByEmail(email);

    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const isPasswordValid = await this.bcryptProvider.comparePassword(
      password,
      user.password as string,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    if (user.is_deleted === true) {
      throw new UnauthorizedException('User account is deleted');
    }

    const payload = { sub: user.id, email: user.email, role: user.role };

    const access_token = this.tokenProvider.generateAccessToken(payload);
    const refresh_token = this.tokenProvider.generateRefreshToken(payload);

    const hashedRefreshToken = this.tokenProvider.hashToken(refresh_token);
    await this.usersService.updateRefreshToken(user.id, hashedRefreshToken);

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password: _, ...userWithoutPassword } = user;

    return {
      access_token,
      refresh_token,
      user: userWithoutPassword,
    };
  }

  async refresh(refreshTokenDto: RefreshTokenDto) {
    try {
      const decoded = this.tokenProvider.verifyRefreshToken(
        refreshTokenDto.token,
      );

      if (decoded.type !== 'refresh') {
        throw new UnauthorizedException('Invalid token type');
      }

      const hashedToken = this.tokenProvider.hashToken(refreshTokenDto.token);
      const user = await this.usersService.findByRefreshToken(hashedToken);

      if (!user) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      if (user.is_deleted === true) {
        throw new UnauthorizedException('User account is deleted');
      }

      const payload = { sub: user.id, email: user.email, role: user.role };
      const access_token = this.tokenProvider.generateAccessToken(payload);
      const new_refresh_token =
        this.tokenProvider.generateRefreshToken(payload);

      const newHashedRefreshToken =
        this.tokenProvider.hashToken(new_refresh_token);
      await this.usersService.updateRefreshToken(
        user.id,
        newHashedRefreshToken,
      );

      return {
        access_token,
        refresh_token: new_refresh_token,
      };
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
  }

  async logout(userId: string) {
    await this.usersService.revokeRefreshToken(userId);
    return { message: 'Logged out successfully' };
  }
}

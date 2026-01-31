import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Request,
} from '@nestjs/common';
import { CreateUserDto } from './dtos/create-user.dto';
import { AuthService } from './providers/auth.service';
import { LoginDto } from './dtos/login.dto';
import { RefreshTokenDto } from './dtos/refresh-token.dto';
import { ApiResponse, ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Public } from './decorators/public.decorator';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('register')
  @ApiResponse({ status: 201, description: 'User registered successfully.' })
  @HttpCode(HttpStatus.CREATED)
  async register(@Body() createUserDto: CreateUserDto) {
    const result = await this.authService.register(createUserDto);
    return {
      message: 'User registered successfully',
      data: result,
    };
  }

  @Public()
  @Post('login')
  @ApiResponse({ status: 200, description: 'Login successful.' })
  @HttpCode(HttpStatus.OK)
  async login(@Body() loginDto: LoginDto) {
    const result = await this.authService.login(loginDto);
    return {
      message: 'Login successful',
      data: result,
    };
  }

  @Public()
  @Post('refresh')
  @ApiResponse({ status: 200, description: 'Token refreshed successfully.' })
  @HttpCode(HttpStatus.OK)
  async refresh(@Body() refreshTokenDto: RefreshTokenDto) {
    const result = await this.authService.refresh(refreshTokenDto);
    return {
      message: 'Token refreshed successfully',
      data: result,
    };
  }

  @Post('logout')
  @ApiBearerAuth()
  @ApiResponse({ status: 200, description: 'Logged out successfully.' })
  @HttpCode(HttpStatus.OK)
  async logout(@Request() req: { user: { sub: string } }) {
    const result = await this.authService.logout(req.user.sub);
    return {
      message: result.message,
    };
  }
}

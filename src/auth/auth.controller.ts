import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { CreateUserDto } from './dtos/create-user.dto';
import { AuthService } from './providers/auth.service';
import { LoginDto } from './dtos/login.dto';
import { ApiResponse } from '@nestjs/swagger';
import { Public } from './decorators/public.decorator';

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
}

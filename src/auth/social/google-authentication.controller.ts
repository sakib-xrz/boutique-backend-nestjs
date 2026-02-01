import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiResponse, ApiTags } from '@nestjs/swagger';
import { Public } from '../decorators/public.decorator';
import { GoogleTokenDto } from './dtos/google-token.dto';
import { GoogleAuthenticationService } from './providers/google-authentication.service';

@ApiTags('Authentication')
@Controller('auth/google')
export class GoogleAuthenticationController {
  constructor(
    private readonly googleAuthenticationService: GoogleAuthenticationService,
  ) {}

  @Public()
  @Post()
  @ApiResponse({
    status: 200,
    description: 'Google authentication successful.',
  })
  @ApiResponse({ status: 401, description: 'Invalid Google token.' })
  @HttpCode(HttpStatus.OK)
  async authenticate(@Body() googleTokenDto: GoogleTokenDto) {
    const result =
      await this.googleAuthenticationService.authenticate(googleTokenDto);
    return {
      message: 'Google authentication successful',
      data: result,
    };
  }
}

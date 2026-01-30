import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Auth, AuthType } from 'src/auth/decorator/auth/auth.decorator';

@ApiTags('users')
@Controller('users')
export class UsersController {
  @Get()
  @Auth(AuthType.BEARER)
  findAll() {
    return {
      message: 'Users fetched successfully',
      data: [],
    };
  }
}

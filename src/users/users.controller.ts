import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { Role } from 'src/generated/prisma';

@ApiTags('users')
@Controller('users')
export class UsersController {
  @Get()
  @Roles(Role.ADMIN)
  findAll() {
    return {
      message: 'Users fetched successfully',
      data: [],
    };
  }
}

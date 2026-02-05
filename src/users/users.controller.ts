import { Controller, Get, Request } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { Role } from '@prisma/client';
import { UsersService } from './providers/users.service';

@ApiTags('users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  @Roles(Role.CUSTOMER, Role.ADMIN)
  async findMe(@Request() req: { user: { sub: string } }) {
    const result = await this.usersService.getMe(req.user.sub);

    return {
      message: 'My profile fetched successfully',
      data: result,
    };
  }
}

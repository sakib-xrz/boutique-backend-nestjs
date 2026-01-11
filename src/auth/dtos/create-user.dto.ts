import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsString,
  Matches,
  MinLength,
} from 'class-validator';

export class CreateUserDto {
  @ApiProperty({
    example: 'test@gmail.com',
  })
  @IsEmail({}, { message: 'email must be a valid email address' })
  email: string;

  @ApiProperty({
    example: 'Password@123',
  })
  @IsString({ message: 'password must be a string' })
  @IsNotEmpty({ message: 'password should not be empty' })
  @MinLength(8, {
    message: 'password must be at least 8 characters long',
  })
  @Matches(/[a-zA-Z]/, {
    message: 'password must contain at least one letter',
  })
  @Matches(/[0-9]/, {
    message: 'password must contain at least one number',
  })
  password: string;

  @ApiProperty({
    example: 'John Doe',
  })
  @IsString({ message: 'name must be a string' })
  @IsNotEmpty({ message: 'name should not be empty' })
  @MinLength(2, {
    message: 'name must be at least 2 characters long',
  })
  name: string;
}

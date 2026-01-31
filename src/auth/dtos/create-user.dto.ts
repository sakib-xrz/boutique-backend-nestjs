import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsEmail,
  IsNotEmpty,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateUserDto {
  @ApiProperty({
    example: 'test@example.com',
  })
  @IsEmail({}, { message: 'email must be a valid email address' })
  @Transform(({ value }) => value?.toLowerCase().trim())
  email: string;

  @ApiProperty({
    example: 'Password@123',
  })
  @IsString({ message: 'password must be a string' })
  @IsNotEmpty({ message: 'password should not be empty' })
  @MinLength(8, {
    message: 'password must be at least 8 characters long',
  })
  @MaxLength(128, {
    message: 'password must not exceed 128 characters',
  })
  @Matches(/[a-z]/, {
    message: 'password must contain at least one lowercase letter',
  })
  @Matches(/[A-Z]/, {
    message: 'password must contain at least one uppercase letter',
  })
  @Matches(/[0-9]/, {
    message: 'password must contain at least one number',
  })
  @Matches(/[!@#$%^&*(),.?":{}|<>]/, {
    message: 'password must contain at least one special character',
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

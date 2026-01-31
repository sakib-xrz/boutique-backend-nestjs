import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class LoginDto {
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
  password: string;
}

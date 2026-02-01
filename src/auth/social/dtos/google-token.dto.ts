import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class GoogleTokenDto {
  @ApiProperty({
    description: 'Google ID token received from Google Sign-In',
    example: 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  @IsNotEmpty({ message: 'Google token is required' })
  @IsString({ message: 'Google token must be a string' })
  token: string;
}

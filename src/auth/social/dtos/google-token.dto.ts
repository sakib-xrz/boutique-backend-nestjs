import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class GoogleTokenDto {
  @ApiProperty({
    description: 'Google authorization code received from Google Sign-In',
    example: '4/0ASc3gC3qylfEiNC8noe5bQoKcxBAsL11j79fbVf5hIU...',
  })
  @IsNotEmpty({ message: 'Google authorization code is required' })
  @IsString({ message: 'Google authorization code must be a string' })
  code: string;

  @ApiProperty({
    description: 'Redirect URI used in the authorization request',
    example: 'http://localhost:3000',
  })
  @IsNotEmpty({ message: 'Redirect URI is required' })
  @IsString({ message: 'Redirect URI must be a string' })
  redirect_uri: string;
}

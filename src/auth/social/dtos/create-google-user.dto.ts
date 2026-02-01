import { Transform } from 'class-transformer';
import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';

export class CreateGoogleUserDto {
  @IsEmail({}, { message: 'email must be a valid email address' })
  @Transform(({ value }) => value?.toLowerCase().trim())
  email: string;

  @IsString({ message: 'name must be a string' })
  @IsNotEmpty({ message: 'name should not be empty' })
  @MinLength(2, {
    message: 'name must be at least 2 characters long',
  })
  name: string;

  @IsString({ message: 'googleId must be a string' })
  @IsNotEmpty({ message: 'googleId should not be empty' })
  googleId: string;

  @IsOptional()
  @IsString({ message: 'imageUrl must be a string' })
  imageUrl: string | null;
}

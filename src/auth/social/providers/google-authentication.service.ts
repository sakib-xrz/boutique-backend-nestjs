import {
  ConflictException,
  Injectable,
  OnModuleInit,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OAuth2Client } from 'google-auth-library';
import { GoogleTokenDto } from '../dtos/google-token.dto';
import { UsersService } from 'src/users/providers/users.service';
import { TokenProvider } from 'src/auth/providers/token.provider';

@Injectable()
export class GoogleAuthenticationService implements OnModuleInit {
  private oauthClient: OAuth2Client;

  constructor(
    private readonly configService: ConfigService,
    private readonly usersService: UsersService,
    private readonly tokenProvider: TokenProvider,
  ) {}

  onModuleInit() {
    const clientId = this.configService.get<string>('GOOGLE_CLIENT_ID');
    const clientSecret = this.configService.get<string>('GOOGLE_CLIENT_SECRET');

    this.oauthClient = new OAuth2Client(clientId, clientSecret);
  }

  public async authenticate(googleTokenDto: GoogleTokenDto) {
    try {
      // Exchange the authorization code for tokens
      const { tokens } = await this.oauthClient.getToken({
        code: googleTokenDto.code,
        redirect_uri: googleTokenDto.redirect_uri,
      });

      if (!tokens.id_token) {
        throw new UnauthorizedException('No ID token received from Google');
      }

      // Verify the ID token
      const ticket = await this.oauthClient.verifyIdToken({
        idToken: tokens.id_token,
      });

      const payload = ticket.getPayload();

      if (!payload || !payload.email || !payload.sub) {
        throw new UnauthorizedException('Invalid Google token payload');
      }

      const { email, name, sub: googleId, picture: imageUrl } = payload;

      let user = await this.usersService.findByGoogleId(googleId);

      if (user) {
        if (user.is_deleted) {
          throw new UnauthorizedException('User account is deleted');
        }

        return this.generateAuthResponse(user);
      }

      const existingEmailUser = await this.usersService.findUserByEmail(email);

      if (existingEmailUser) {
        user = await this.usersService.linkGoogleAccount(
          existingEmailUser.id,
          googleId,
          imageUrl,
        );

        return this.generateAuthResponse(user);
      }

      const newUser = await this.usersService.createGoogleUser({
        name: name || email.split('@')[0],
        email,
        googleId,
        imageUrl: imageUrl ?? null,
      });

      return this.generateAuthResponse(newUser);
    } catch (error) {
      if (
        error instanceof UnauthorizedException ||
        error instanceof ConflictException
      ) {
        throw error;
      }
      throw new UnauthorizedException('Failed to authenticate with Google');
    }
  }

  private async generateAuthResponse(user: {
    id: string;
    email: string;
    role: string;
  }) {
    const tokenPayload = { sub: user.id, email: user.email, role: user.role };

    const { access_token, refresh_token } =
      await this.tokenProvider.generateTokens(tokenPayload);

    return {
      access_token,
      refresh_token,
      user,
    };
  }
}

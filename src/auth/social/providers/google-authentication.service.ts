import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OAuth2Client, TokenPayload } from 'google-auth-library';
import { GoogleTokenDto } from '../dtos/google-token.dto';
import { UsersService } from 'src/users/providers/users.service';
import { TokenProvider } from 'src/auth/providers/token.provider';

@Injectable()
export class GoogleAuthenticationService implements OnModuleInit {
  private oauthClientId: OAuth2Client;

  constructor(
    private readonly configService: ConfigService,
    private readonly usersService: UsersService,
    private readonly tokenProvider: TokenProvider,
  ) {}

  onModuleInit() {
    const clientId = this.configService.get<string>('GOOGLE_CLIENT_ID');
    const clientSecret = this.configService.get<string>('GOOGLE_CLIENT_SECRET');

    this.oauthClientId = new OAuth2Client(clientId, clientSecret);
  }

  public async authentication(googleTokenDto: GoogleTokenDto) {
    const ticket = await this.oauthClientId.verifyIdToken({
      idToken: googleTokenDto.token,
    });

    const {
      email,
      name,
      sub: googleId,
      picture: imageUrl,
    } = ticket.getPayload() as TokenPayload;

    let user = await this.usersService.findByGoogleId(googleId);

    if (user) {
      const payload = { sub: user.id, email: user.email, role: user.role };

      const { access_token, refresh_token } =
        await this.tokenProvider.generateTokens(payload);

      return {
        access_token,
        refresh_token,
        user,
      };
    }
    const newUser = await this.usersService.createGoogleUser({
      name: name!,
      email: email!,
      googleId,
      imageUrl: imageUrl!,
    });

    const payload = {
      sub: newUser.id,
      email: newUser.email,
      role: newUser.role,
    };

    const { access_token, refresh_token } =
      await this.tokenProvider.generateTokens(payload);

    return {
      access_token,
      refresh_token,
      user: newUser,
    };
  }
}

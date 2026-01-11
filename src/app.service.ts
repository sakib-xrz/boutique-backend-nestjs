import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AppService {
  constructor(private readonly configService: ConfigService) {}

  getHello() {
    return {
      name: 'Boutique Backend API',
      version: '1.0.0',
      environment: this.configService.get<string>('nodeEnv', 'development'),
    };
  }
}

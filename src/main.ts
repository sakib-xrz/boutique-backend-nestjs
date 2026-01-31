import * as express from 'express';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { ValidationPipe } from '@nestjs/common';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const configService = app.get(ConfigService);

  const port = configService.get<number>('PORT', 8000);
  const apiPrefix = configService.get<string>('API_PREFIX', 'api/v1');
  const normalizedApiPrefix = apiPrefix.startsWith('/')
    ? apiPrefix
    : `/${apiPrefix}`;
  const corsOrigin = configService.get<string>(
    'CORS_ORIGIN',
    'http://localhost:3000',
  );
  const frontendUrls = corsOrigin?.split(',');

  // Enable body parsing for JSON and URL-encoded data
  app.use(
    (
      req: express.Request,
      res: express.Response,
      next: express.NextFunction,
    ) => {
      return express.json()(req, res, next);
    },
  );

  app.use(
    (
      req: express.Request,
      res: express.Response,
      next: express.NextFunction,
    ) => {
      return express.urlencoded({ extended: true })(req, res, next);
    },
  );

  // Set global API prefix
  app.setGlobalPrefix(normalizedApiPrefix);

  // Enable CORS
  app.enableCors({
    origin: frontendUrls,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Cookie'],
  });

  // Global pipes
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Global interceptors
  app.useGlobalInterceptors(
    new LoggingInterceptor(),
    new TransformInterceptor(),
  );

  // Global exception filter
  app.useGlobalFilters(new HttpExceptionFilter());

  // Swagger documentation
  const config = new DocumentBuilder()
    .setTitle('Boutique Backend')
    .setDescription('Boutique Backend API documentation')
    .setVersion('1.0')
    .addServer('http://localhost:8000')
    .build();

  const document = SwaggerModule.createDocument(app, config);

  SwaggerModule.setup(`${apiPrefix}/docs`, app, document);

  await app.listen(port);
  console.log(
    `🚀 Application is running on: http://localhost:${port}/${apiPrefix}`,
  );
  console.log(
    `📚 Swagger documentation: http://localhost:${port}/${apiPrefix}/docs`,
  );
}

bootstrap();

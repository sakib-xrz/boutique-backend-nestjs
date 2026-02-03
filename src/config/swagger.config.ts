import { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

export function setupSwagger(app: INestApplication, apiPrefix: string): void {
  const config = new DocumentBuilder()
    .setTitle('Boutique Backend')
    .setDescription('Boutique Backend API documentation')
    .setVersion('1.0')
    .addServer(process.env.BACKEND_URL || 'http://localhost:8000')
    .addBearerAuth(
      { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
      'JWT-AUTH',
    )
    .addSecurityRequirements('JWT-AUTH')
    .build();

  const document = SwaggerModule.createDocument(app, config);

  // Define the interceptor as a clean string
  const responseInterceptor = `
    (response) => {
      const authEndpoints = ['/login', '/register', '/refresh', '/google'];
      const isAuthEndpoint = authEndpoints.some(path => response.url.includes(path));
      
      if (response.ok && isAuthEndpoint) {
        const token = response.body?.data?.access_token;
        if (token && window.ui) {
          window.ui.preauthorizeApiKey('JWT-AUTH', token);
          console.log('Swagger: Token automatically updated');
        }
      }
      return response;
    }
  `;

  SwaggerModule.setup(`${apiPrefix}/docs`, app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      responseInterceptor: eval(responseInterceptor),
      tagsSorter: 'alpha',
      defaultModelsExpandDepth: -1,
    },
  });
}

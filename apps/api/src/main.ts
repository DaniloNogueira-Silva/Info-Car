import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ['log', 'error', 'warn', 'debug', 'verbose'],
  });

  //  Helmet — Proteção de Headers HTTP
  app.use(helmet());

  //  Global Exception Filter
  app.useGlobalFilters(new GlobalExceptionFilter());

  //  Global Prefix
  app.setGlobalPrefix('api/v1');

  // Validation Pipe 
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  // Swagger / OpenAPI
  const config = new DocumentBuilder()
    .setTitle('Gestão de Frota info-car')
    .setDescription(
      'API REST para gestão de frota com Clean Architecture e DDD',
    )
    .setVersion('1.0')
    .addBearerAuth()
    .addTag('Vehicles', 'Operações de veículos')
    .addTag('Models', 'Operações de modelos')
    .addTag('Brands', 'Operações de marcas')
    .addTag('Telemetry', 'Simulação e consulta de telemetria IoT')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document);

  // Start
  const port = process.env.API_PORT ?? 3000;
  await app.listen(port);

  console.log(`🚀 API running on http://localhost:${port}`);
  console.log(`📄 Swagger docs at http://localhost:${port}/docs`);
}
bootstrap();

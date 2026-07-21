/* eslint-disable @typescript-eslint/no-unsafe-call */
import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import express from 'express';
import { AppModule } from '../app.module';
import cookieParser from 'cookie-parser';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ZodValidationPipe } from 'nestjs-zod';

const server = express();
let appReady: Promise<void> | null = null;

async function bootstrapServer() {
  const app = await NestFactory.create(AppModule, new ExpressAdapter(server));
  app.use(cookieParser());

  // forward proxy settings to the underlying Express instance
  (app.getHttpAdapter().getInstance() as express.Application).set(
    'trust proxy',
    1,
  );

  // dentro de bootstrapServer(), antes de crear el documento de Swagger:
  app.useGlobalPipes(new ZodValidationPipe());

  const config = new DocumentBuilder()
    .setTitle('Dashboard API')
    .setDescription('Endpoints del backend de mi dashboard personal')
    .setVersion('1.0')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document, {
    customCssUrl:
      'https://cdn.jsdelivr.net/npm/swagger-ui-dist@5.32.8/swagger-ui.css',
    customJs: [
      'https://cdn.jsdelivr.net/npm/swagger-ui-dist@5.32.8/swagger-ui-bundle.js',
      'https://cdn.jsdelivr.net/npm/swagger-ui-dist@5.32.8/swagger-ui-standalone-preset.js',
    ],
  });

  await app.init();
}

export default async function handler(
  req: express.Request,
  res: express.Response,
) {
  if (!appReady) {
    appReady = bootstrapServer();
  }
  await appReady;
  server(req, res);
}

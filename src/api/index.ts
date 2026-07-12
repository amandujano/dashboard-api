import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import express from 'express';
import { AppModule } from '../app.module';
import cookieParser from 'cookie-parser';

const server = express();
let appReady: Promise<void> | null = null;

async function bootstrapServer() {
  const app = await NestFactory.create(AppModule, new ExpressAdapter(server));
  app.use(cookieParser());
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

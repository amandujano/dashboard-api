/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import cookieParser from 'cookie-parser';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ZodValidationPipe } from 'nestjs-zod';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.use(cookieParser());

  // dentro de bootstrap() / bootstrapServer(), antes de crear el documento de Swagger:
  app.useGlobalPipes(new ZodValidationPipe());
  // The real topology in front of this app has an unknown/variable number of
  // internal hops (Coolify/Traefik, plus the frontend's own server-side proxy
  // relaying the request before it reaches this backend), so trusting by a
  // fixed hop count is fragile and silently wrong if that count ever changes.
  // Trusting any peer in the private/internal address ranges and stopping at
  // the first public address in the chain is the robust, address-based
  // equivalent — Express's documented recommended setting for "behind one or
  // more reverse proxies on a private network".
  app
    .getHttpAdapter()
    .getInstance()
    .set('trust proxy', ['loopback', 'linklocal', 'uniquelocal']);

  const config = new DocumentBuilder()
    .setTitle('Dashboard API')
    .setDescription('Endpoints del backend de mi dashboard personal')
    .setVersion('1.0')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document);

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();

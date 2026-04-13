import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { configureVars } from '@environment/vars';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';

async function bootstrap() {
  configureVars();

  const app = await NestFactory.create(AppModule);

  app.use(helmet.xssFilter());
  app.use(helmet.noSniff());
  app.use(helmet.hidePoweredBy());
  app.use(helmet.frameguard());
  app.use(compression());
  app.use(morgan('dev'));

  app.enableCors({
    origin: process.env['FRONTEND_ORIGIN'],
    methods: ['GET', 'POST'],
  });

  const port = process.env['PORT'] ?? '4200';
  await app.listen(port);
  console.log(`API ready on port ${port}`);
}

bootstrap();

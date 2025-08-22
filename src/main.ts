import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Enable CORS
  app.enableCors({
    origin: [
      process.env.FRONTEND_URL || 'http://localhost:3001',
      'http://localhost:3000', // Alternative React port
      'http://localhost:3001', // React dev server default
      'http://localhost:5173', // Vite default
      'https://images-storage-reactjs.vercel.app', // Vercel production
      'https://images-storage-reactjs-9k9c0c1ej-kh4n9s-projects.vercel.app', // Vercel preview
      /https:\/\/.*\.vercel\.app$/, // All Vercel preview deployments
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  await app.listen(process.env.PORT ?? 5000);
  console.log(`Application is running on: ${await app.getUrl()}`);
}
void bootstrap();

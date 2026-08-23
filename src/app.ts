import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import apiRouter from './routes';
import { errorHandler } from './middlewares/errorHandler';
import { sendError } from './utils/response.util';

export function createApp(): Express {
  const app = express();

  // Global Middlewares
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Root Welcome Route
  app.get('/', (_req: Request, res: Response) => {
    res.json({
      name: 'Invoice Management API',
      version: '1.0.0',
      description: 'RESTful API for Invoices with State Machine, PostgreSQL, and PDFKit',
      endpoints: {
        health: '/api/health',
        invoices: '/api/invoices',
      },
    });
  });

  // Mount API Routes under /api
  app.use('/api', apiRouter);

  // 404 Route Handler
  app.use((_req: Request, res: Response) => {
    sendError(res, 'Route not found', 404);
  });

  // Centralized Error Handling Middleware
  app.use(errorHandler);

  return app;
}

export const app = createApp();

import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import swaggerUi from 'swagger-ui-express';
import apiRouter from './routes';
import { swaggerDocument } from './docs/swagger';
import { errorHandler } from './middlewares/errorHandler';
import { sendError } from './utils/response.util';

export function createApp(): Express {
  const app = express();

  // Global Middlewares
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Swagger Interactive Documentation
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

  // Root Welcome Route
  app.get('/', (_req: Request, res: Response) => {
    res.json({
      name: 'Invoice Management API',
      version: '1.0.0',
      description: 'RESTful API for Invoices with State Machine, PostgreSQL, and PDFKit',
      endpoints: {
        documentation: '/api-docs',
        health: '/api/health',
        invoices: '/api/invoices',
        analytics: '/api/invoices/analytics/summary',
        csvExport: '/api/invoices/export/csv',
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

import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import swaggerUi from 'swagger-ui-express';
import apiRouter from './routes';
import { swaggerDocument } from './docs/swagger';
import { errorHandler } from './middlewares/errorHandler';
import { requestIdMiddleware, apiRateLimiter } from './middlewares/security.middleware';
import { sendError } from './utils/response.util';

export function createApp(): Express {
  const app = express();

  // Security HTTP Headers
  app.use(
    helmet({
      contentSecurityPolicy: false, // allow Swagger UI assets inline
    })
  );

  // Request ID Tracing Middleware
  app.use(requestIdMiddleware);

  // Global Middlewares
  app.use(cors());
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true }));

  // API Rate Limiting (Applied to /api endpoints)
  app.use('/api', apiRateLimiter);

  // Swagger Interactive Documentation
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

  // Root Welcome Route
  app.get('/', (_req: Request, res: Response) => {
    res.json({
      name: 'Invoice Management API - Enterprise Edition',
      version: '1.0.0',
      description: 'RESTful API for Invoices with State Machine, PostgreSQL, PDFKit, VietQR, Email, and JWT Auth',
      endpoints: {
        documentation: '/api-docs',
        health: '/api/health',
        auth: '/api/auth/demo-accounts',
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

import { Router, Request, Response } from 'express';
import invoiceRoutes from './invoice.route';
import authRoutes from './auth.route';
import { sendSuccess } from '../utils/response.util';

const apiRouter = Router();

// Health Check Endpoint
apiRouter.get('/health', (_req: Request, res: Response) => {
  sendSuccess(res, { status: 'UP', timestamp: new Date().toISOString() }, 'Invoice Management API is healthy');
});

// Authentication Routes
apiRouter.use('/auth', authRoutes);

// Invoice Resource Routes
apiRouter.use('/invoices', invoiceRoutes);

export default apiRouter;

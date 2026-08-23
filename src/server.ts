import { app } from './app';
import { env } from './config/env';

const server = app.listen(env.PORT, () => {
  console.log(`🚀 Invoice Management Server is running on http://localhost:${env.PORT}`);
  console.log(`📡 Environment: ${env.NODE_ENV}`);
  console.log(`📄 Health check: http://localhost:${env.PORT}/api/health`);
  console.log(`📑 Invoices API: http://localhost:${env.PORT}/api/invoices`);
});

// Graceful Shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
    process.exit(0);
  });
});

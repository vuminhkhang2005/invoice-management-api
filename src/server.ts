import { app } from './app';
import { env } from './config/env';
import { ensurePostgresServer } from './config/embeddedDb';

async function bootstrap() {
  try {
    // 1. Ensure PostgreSQL is accessible or start embedded engine
    await ensurePostgresServer(5432);

    // 2. Start HTTP Express Server
    const server = app.listen(env.PORT, () => {
      console.log(`🚀 Invoice Management Server is running on http://localhost:${env.PORT}`);
      console.log(`📡 Environment: ${env.NODE_ENV}`);
      console.log(`🌐 Interactive Swagger Docs: http://localhost:${env.PORT}/api-docs`);
      console.log(`📄 Health check: http://localhost:${env.PORT}/api/health`);
      console.log(`📑 Invoices API: http://localhost:${env.PORT}/api/invoices`);
      console.log(`📊 Analytics Dashboard: http://localhost:${env.PORT}/api/invoices/analytics/summary`);
    });

    // Graceful Shutdown
    const handleShutdown = () => {
      console.log('Stopping Invoice Management Server...');
      server.close(() => {
        console.log('HTTP server closed.');
        process.exit(0);
      });
    };

    process.on('SIGTERM', handleShutdown);
    process.on('SIGINT', handleShutdown);
  } catch (error) {
    console.error('❌ Failed to start application server:', error);
    process.exit(1);
  }
}

bootstrap();

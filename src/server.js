import app from './app.js';
import config from './config/index.js';

let server = null;

// Only bind to local port when not running in Vercel serverless environment
if (!process.env.VERCEL) {
  server = app.listen(config.port, () => {
    console.log(`GitEx server running in ${config.env} mode on http://localhost:${config.port}`);
  });

  const shutdown = (signal) => {
    console.log(`Received ${signal}. Shutting down gracefully...`);
    if (server) {
      server.close(() => {
        console.log('HTTP server closed.');
        process.exit(0);
      });
    }
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

export { server };
export default app;


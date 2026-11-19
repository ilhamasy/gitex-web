import app from './app.js';
import config from './config/index.js';

let server = null;

// Only bind to local port when not running in Vercel serverless environment
if (!process.env.VERCEL) {
  const startServer = (port) => {
    server = app.listen(port, () => {
      console.log(`GitEx server running in ${config.env} mode on http://localhost:${port}`);
    });

    server.on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        console.warn(`Port ${port} is in use, falling back to port ${port + 1}...`);
        startServer(port + 1);
      } else {
        console.error('Server error:', err);
      }
    });
  };

  startServer(config.port);

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


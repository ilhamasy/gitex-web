import app from './app.js';
import config from './config/index.js';

const server = app.listen(config.port, () => {
  console.log(`GitEx server running in ${config.env} mode on http://localhost:${config.port}`);
});

// Graceful shutdown
const shutdown = (signal) => {
  console.log(`Received ${signal}. Shutting down gracefully...`);
  server.close(() => {
    console.log('HTTP server closed.');
    process.exit(0);
  });
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

export default server;

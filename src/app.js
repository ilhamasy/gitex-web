import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import routes from './routes/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// View engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// Core middleware
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// Static files
app.use(express.static(path.join(__dirname, '../public')));

// Mount routes
app.use('/', routes);

// 404 Handler
app.use((req, res, next) => {
  const isApiRequest = req.path.startsWith('/api') || req.headers.accept?.includes('application/json');
  if (isApiRequest) {
    return res.status(404).json({
      error: 'Not Found',
      message: `Endpoint ${req.method} ${req.path} not found`,
    });
  }

  res.status(404).render('error', {
    title: '404 — Page Not Found',
    statusCode: 404,
    message: 'The requested page could not be found.',
  });
});

// Centralized error handler
app.use((err, req, res, next) => {
  const statusCode = err.status || err.statusCode || 500;
  const message = err.message || 'Internal Server Error';
  
  if (process.env.NODE_ENV !== 'test') {
    console.error(`[Error] ${req.method} ${req.path}:`, err);
  }

  const isApiRequest = req.path.startsWith('/api') || req.headers.accept?.includes('application/json');
  if (isApiRequest) {
    return res.status(statusCode).json({
      error: err.name || 'Error',
      message,
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
    });
  }

  res.status(statusCode).render('error', {
    title: `${statusCode} — Error`,
    statusCode,
    message,
  });
});

export default app;


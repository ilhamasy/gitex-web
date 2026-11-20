import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import routes from './routes/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// View engine setup: resolve safely for both local development and Vercel serverless
const viewsPath = fs.existsSync(path.join(process.cwd(), 'src', 'views'))
  ? path.join(process.cwd(), 'src', 'views')
  : path.join(__dirname, 'views');

const publicPath = fs.existsSync(path.join(process.cwd(), 'public'))
  ? path.join(process.cwd(), 'public')
  : path.join(__dirname, '../public');

app.set('views', viewsPath);
app.set('view engine', 'ejs');

// Core middleware
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// Static files
app.use(express.static(publicPath));
app.use('/assets', express.static(path.resolve(process.cwd(), 'assets')));

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

  try {
    res.status(404).render('error', {
      title: '404 — Page Not Found',
      statusCode: 404,
      message: 'The requested page could not be found.',
    });
  } catch (err) {
    res.status(404).send('<h1>404 — Page Not Found</h1><p>The requested page could not be found.</p>');
  }
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

  try {
    res.status(statusCode).render('error', {
      title: `${statusCode} — Error`,
      statusCode,
      message,
    });
  } catch (renderErr) {
    res.status(statusCode).send(`<h1>Error ${statusCode}</h1><p>${message}</p>`);
  }
});

export default app;


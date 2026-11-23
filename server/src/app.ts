import express from 'express';
import cors from 'cors';
import helmet from 'helmet';

import { env } from './config/env.js';
import apiRoutes from './routes/index.js';
import { notFound } from './middleware/notFound.js';
import { errorHandler } from './middleware/errorHandler.js';
import { HttpError } from './utils/HttpError.js';

// The app is built here but NOT started here (see server.ts).
// Keeping them separate lets us reuse `app` later for tests or serverless deployment.
const app = express();

// Security headers (X-Content-Type-Options, X-Frame-Options, etc.)
app.use(helmet());

// Only allow requests from our own frontend origin(s).
app.use(
  cors({
    origin(origin, callback) {
      // Requests without an Origin header (curl, Postman, server-to-server) are allowed.
      if (!origin || env.clientOrigins.includes(origin)) {
        callback(null, true);
        return;
      }
      callback(new HttpError(403, `Origin ${origin} not allowed by CORS`));
    },
    credentials: true,
  }),
);

// Parse JSON bodies, with a size limit to reject oversized payloads.
app.use(express.json({ limit: '1mb' }));

// All REST endpoints live under /api
app.use('/api', apiRoutes);

// Must be registered after all routes.
app.use(notFound);
app.use(errorHandler);

export default app;

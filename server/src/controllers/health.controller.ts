import type { Request, Response } from 'express';
import { env } from '../config/env.js';
import type { HealthResponse } from '../types/api.js';

// Simple endpoint the frontend (and later, uptime monitors) can call
// to confirm the API is reachable.
export const getHealth = (_req: Request, res: Response<HealthResponse>): void => {
  res.json({
    status: 'ok',
    service: 'jobtrack-ai-api',
    environment: env.nodeEnv,
    uptimeSeconds: Math.round(process.uptime()),
    timestamp: new Date().toISOString(),
  });
};

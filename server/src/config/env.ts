// Central place to read environment variables.
// Every other file imports from here instead of touching process.env directly,
// so defaults and validation live in one spot.

export type NodeEnv = 'development' | 'production' | 'test';

export interface Env {
  port: number;
  nodeEnv: NodeEnv;
  clientOrigins: string[];
}

const parseOrigins = (value: string): string[] =>
  value
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

const parseNodeEnv = (value: string | undefined): NodeEnv =>
  value === 'production' || value === 'test' ? value : 'development';

export const env: Env = {
  port: Number(process.env.PORT) || 4000,
  nodeEnv: parseNodeEnv(process.env.NODE_ENV),
  clientOrigins: parseOrigins(process.env.CLIENT_URL ?? 'http://localhost:5173'),
};

export const isProduction = env.nodeEnv === 'production';

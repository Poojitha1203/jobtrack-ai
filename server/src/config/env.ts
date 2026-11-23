import { z } from 'zod';

// Central place to read and VALIDATE environment variables.
// If something required is missing, the server stops at startup with a clear message
// instead of failing later with a confusing error.

const envSchema = z.object({
  PORT: z.coerce.number().int().positive().default(4000),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  CLIENT_URL: z.string().default('http://localhost:5173'),

  SUPABASE_URL: z.url('SUPABASE_URL must be a URL like https://xxxx.supabase.co'),
  // Publishable key: low-privilege, Row Level Security applies. Used to act AS the signed-in user.
  SUPABASE_PUBLISHABLE_KEY: z.string('is required (starts with sb_publishable_)'),
  // Secret key: bypasses RLS. Only needed from Phase 10 (payments) and Phase 11 (admin).
  SUPABASE_SECRET_KEY: z.string().min(1).optional(),
});

// Treat empty values (e.g. `SUPABASE_SECRET_KEY=`) as "not set".
const rawEnv = Object.fromEntries(Object.entries(process.env).filter(([, value]) => value !== ''));

const parsed = envSchema.safeParse(rawEnv);

if (!parsed.success) {
  console.error('\n❌ Invalid or missing server environment variables:');
  for (const issue of parsed.error.issues) {
    console.error(`   • ${issue.path.join('.')}: ${issue.message}`);
  }
  console.error('\n   Copy server/.env.example to server/.env and fill in the values.\n');
  process.exit(1);
}

const values = parsed.data;

const parseOrigins = (value: string): string[] =>
  value
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

export const env = {
  port: values.PORT,
  nodeEnv: values.NODE_ENV,
  clientOrigins: parseOrigins(values.CLIENT_URL),
  supabaseUrl: values.SUPABASE_URL,
  supabasePublishableKey: values.SUPABASE_PUBLISHABLE_KEY,
  supabaseSecretKey: values.SUPABASE_SECRET_KEY,
};

export type NodeEnv = typeof env.nodeEnv;

export const isProduction = env.nodeEnv === 'production';

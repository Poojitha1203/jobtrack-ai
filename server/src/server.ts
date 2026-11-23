import app from './app.js';
import { env } from './config/env.js';

const server = app.listen(env.port, () => {
  console.log(`JobTrack AI API running on http://localhost:${env.port} (${env.nodeEnv})`);
});

server.on('error', (error: NodeJS.ErrnoException) => {
  if (error.code === 'EADDRINUSE') {
    console.error(`Port ${env.port} is already in use. Change PORT in server/.env.`);
  } else {
    console.error(error);
  }
  process.exit(1);
});

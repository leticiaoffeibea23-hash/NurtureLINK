import { validateEnv } from './utils/env-validator';
validateEnv(); // Ensure this is called FIRST to load .env variables

import net from 'net';
import { PrismaClient } from '@prisma/client';
import { createApp } from './app';

const BASE_PORT = Number(process.env.PORT ?? 8181);
const prisma = new PrismaClient();

/** Resolves to the first port >= start that is not in use. */
function findFreePort(start: number): Promise<number> {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.once('error', () => resolve(findFreePort(start + 1)));
    server.once('listening', () => server.close(() => resolve(start)));
    server.listen(start);
  });
}

async function startServer() {
  try {
    await prisma.$connect();
    console.log('[NurtureLink API] Database connected successfully.');

    const app = createApp();
    const port = await findFreePort(BASE_PORT);

    if (port !== BASE_PORT) {
      console.warn(`[NurtureLink API] Port ${BASE_PORT} in use — using port ${port} instead.`);
    }

    app.listen(port, () => {
      console.log(`[NurtureLink API] listening on port ${port}`);
    });
  } catch (error) {
    console.error('[NurtureLink API] Failed to connect to the database. Exiting...', error);
    process.exit(1);
  }
}

startServer();

import { Worker, type Processor, type Worker as BullWorker } from 'bullmq';
import { Redis } from 'ioredis';
import { QUEUE_NAMES } from '@udccerete/api/lib/queue';
import { env, isRedisConfigured, workerVersion } from './env.js';
import { logWorkerStartup, QUEUE_PROCESSORS } from './queues.js';

const workers: BullWorker[] = [];
let connection: Redis | null = null;

function getConnection(): Redis {
  if (!connection) {
    connection = new Redis(env.REDIS_URL!, { maxRetriesPerRequest: null });
  }
  return connection;
}

export function startWorkers(): BullWorker[] {
  if (!isRedisConfigured() || !env.REDIS_URL) {
    console.warn('[worker] REDIS_URL no configurada; workers no iniciados');
    return [];
  }

  logWorkerStartup();
  console.info(`[worker] v${workerVersion} iniciando ${Object.keys(QUEUE_PROCESSORS).length} colas`);

  const conn = getConnection();

  for (const [queueName, processor] of Object.entries(QUEUE_PROCESSORS)) {
    const worker = new Worker(queueName, processor as Processor, {
      connection: conn,
      concurrency: queueName === QUEUE_NAMES.SEARCH_REINDEX ? 2 : 5,
    });

    worker.on('failed', (job, err) => {
      console.error(`[worker:${queueName}] job=${job?.id} failed`, err);
    });

    worker.on('completed', (job) => {
      if (env.LOG_LEVEL === 'debug') {
        console.debug(`[worker:${queueName}] job=${job.id} completed`);
      }
    });

    workers.push(worker);
    console.info(`[worker] escuchando cola ${queueName}`);
  }

  return workers;
}

export async function stopWorkers(): Promise<void> {
  await Promise.all(workers.map((worker) => worker.close()));
  workers.length = 0;
  if (connection) {
    await connection.quit();
    connection = null;
  }
}

import { fileURLToPath } from 'node:url';

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  startWorkers();

  const shutdown = async (signal: string) => {
    console.info(`[worker] ${signal} recibido, cerrando...`);
    await stopWorkers();
    process.exit(0);
  };

  process.on('SIGINT', () => void shutdown('SIGINT'));
  process.on('SIGTERM', () => void shutdown('SIGTERM'));
}

import { Queue } from 'bullmq';
import { Redis } from 'ioredis';
import { env, isRedisConfigured } from '../env.js';

export const QUEUE_NAMES = {
  SEARCH_REINDEX: 'search.reindex',
  NOTIFY_COMMENT_REPLY: 'notify.comment_reply',
  NOTIFY_POST_COMMENT: 'notify.post_comment',
  NOTIFY_URGENT: 'notify.urgent',
  MAIL_DIGEST: 'mail.digest',
  USER_PURGE: 'user.purge',
} as const;

let connection: Redis | null = null;
const queues = new Map<string, Queue>();

function getConnection(): Redis | null {
  if (!isRedisConfigured() || !env.REDIS_URL) return null;
  if (!connection) {
    connection = new Redis(env.REDIS_URL, { maxRetriesPerRequest: null });
  }
  return connection;
}

function getQueue(name: string): Queue | null {
  const conn = getConnection();
  if (!conn) return null;
  if (!queues.has(name)) {
    queues.set(name, new Queue(name, { connection: conn }));
  }
  return queues.get(name)!;
}

async function enqueue(name: string, data: Record<string, unknown>, jobId?: string) {
  const queue = getQueue(name);
  if (!queue) {
    if (env.NODE_ENV !== 'production') {
      console.info('[queue noop]', name, data);
    }
    return;
  }
  await queue.add(name, data, jobId ? { jobId } : undefined);
}

export async function enqueueSearchReindex(payload: { entityType: string; entityId: string }) {
  await enqueue(QUEUE_NAMES.SEARCH_REINDEX, payload);
}

export async function enqueueCommentReply(payload: {
  commentId: string;
  recipientId: string;
}) {
  await enqueue(QUEUE_NAMES.NOTIFY_COMMENT_REPLY, payload);
}

export async function enqueuePostComment(payload: { postId: string; authorId: string }) {
  await enqueue(QUEUE_NAMES.NOTIFY_POST_COMMENT, payload);
}

export async function enqueueUrgentNotification(payload: {
  programId: string;
  title: string;
  body: string;
  link?: string;
}) {
  await enqueue(QUEUE_NAMES.NOTIFY_URGENT, payload);
}

export async function enqueueUserPurge(payload: { userId: string; scheduledAt: string }) {
  await enqueue(QUEUE_NAMES.USER_PURGE, payload, `purge:${payload.userId}`);
}

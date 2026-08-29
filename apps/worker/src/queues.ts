import type { Job, Processor } from 'bullmq';
import type { SearchResult } from '@udccerete/schemas';
import { indexDocument, isTypesenseAvailable } from '@udccerete/api/adapters/typesense';
import { isResendAvailable, sendEmail } from '@udccerete/api/adapters/resend';
import { QUEUE_NAMES } from '@udccerete/api/lib/queue';
import { env } from './env.js';

type SearchReindexPayload = {
  entityType: string;
  entityId: string;
};

type CommentReplyPayload = {
  commentId: string;
  recipientId: string;
};

type PostCommentPayload = {
  postId: string;
  authorId: string;
};

type UrgentNotificationPayload = {
  programId: string;
  title: string;
  body: string;
  link?: string;
};

type UserPurgePayload = {
  userId: string;
  scheduledAt: string;
};

function logJob(queue: string, job: Job, message: string) {
  console.info(`[worker:${queue}] job=${job.id} ${message}`, job.data);
}

export async function processSearchReindex(job: Job<SearchReindexPayload>) {
  const { entityType, entityId } = job.data;
  logJob(QUEUE_NAMES.SEARCH_REINDEX, job, `reindex ${entityType}:${entityId}`);

  if (!isTypesenseAvailable()) {
    console.warn('[worker:search.reindex] Typesense no configurado, omitiendo indexado');
    return;
  }

  await indexDocument({
    type: entityType as SearchResult['type'],
    id: entityId,
    title: `${entityType} ${entityId}`,
    excerpt: null,
    url: `/${entityType}s/${entityId}`,
    publishedAt: null,
  });
}

export async function processNotifyCommentReply(job: Job<CommentReplyPayload>) {
  const { commentId, recipientId } = job.data;
  logJob(QUEUE_NAMES.NOTIFY_COMMENT_REPLY, job, `notify recipient=${recipientId}`);

  if (!isResendAvailable()) {
    console.warn('[worker:notify.comment_reply] Resend no configurado, omitiendo correo');
    return;
  }

  await sendEmail({
    to: `user+${recipientId}@udccerete.edu.co`,
    subject: 'Nueva respuesta a tu comentario',
    text: `Tienes una nueva respuesta al comentario ${commentId}.`,
  });
}

export async function processNotifyPostComment(job: Job<PostCommentPayload>) {
  const { postId, authorId } = job.data;
  logJob(QUEUE_NAMES.NOTIFY_POST_COMMENT, job, `notify author=${authorId}`);

  if (!isResendAvailable()) {
    console.warn('[worker:notify.post_comment] Resend no configurado, omitiendo correo');
    return;
  }

  await sendEmail({
    to: `user+${authorId}@udccerete.edu.co`,
    subject: 'Nuevo comentario en tu publicación',
    text: `Hay un nuevo comentario en la publicación ${postId}.`,
  });
}

export async function processNotifyUrgent(job: Job<UrgentNotificationPayload>) {
  const { programId, title, body, link } = job.data;
  logJob(QUEUE_NAMES.NOTIFY_URGENT, job, `urgent program=${programId}`);

  if (!isResendAvailable()) {
    console.warn('[worker:notify.urgent] Resend no configurado, omitiendo correo');
    return;
  }

  await sendEmail({
    to: `program+${programId}@udccerete.edu.co`,
    subject: title,
    text: link ? `${body}\n\n${link}` : body,
  });
}

export async function processMailDigest(job: Job<Record<string, unknown>>) {
  logJob(QUEUE_NAMES.MAIL_DIGEST, job, 'mail digest');

  if (!isResendAvailable()) {
    console.warn('[worker:mail.digest] Resend no configurado, omitiendo correo');
    return;
  }

  await sendEmail({
    to: 'digest@udccerete.edu.co',
    subject: 'Boletín semanal UDEC Cereté',
    text: 'Resumen semanal (stub).',
  });
}

export async function processUserPurge(job: Job<UserPurgePayload>) {
  const { userId, scheduledAt } = job.data;
  logJob(QUEUE_NAMES.USER_PURGE, job, `purge scheduled at ${scheduledAt}`);
  console.info(
    `[worker:user.purge] eliminación programada para userId=${userId} en ${scheduledAt} (stub)`,
  );
}

export const QUEUE_PROCESSORS: Record<string, Processor> = {
  [QUEUE_NAMES.SEARCH_REINDEX]: processSearchReindex,
  [QUEUE_NAMES.NOTIFY_COMMENT_REPLY]: processNotifyCommentReply,
  [QUEUE_NAMES.NOTIFY_POST_COMMENT]: processNotifyPostComment,
  [QUEUE_NAMES.NOTIFY_URGENT]: processNotifyUrgent,
  [QUEUE_NAMES.MAIL_DIGEST]: processMailDigest,
  [QUEUE_NAMES.USER_PURGE]: processUserPurge,
};

export function logWorkerStartup() {
  console.info(`[worker] NODE_ENV=${env.NODE_ENV} redis=${Boolean(env.REDIS_URL)}`);
}

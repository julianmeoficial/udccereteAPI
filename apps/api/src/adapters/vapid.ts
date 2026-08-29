import * as webpush from 'web-push';
import { env } from '../env.js';

export type WebPushPayload = {
  title: string;
  body: string;
  url?: string;
  icon?: string;
};

export type WebPushSubscription = {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
};

export type SendWebPushResult = {
  statusCode: number;
} | null;

let configured = false;

function ensureVapidConfigured(): boolean {
  if (configured) return true;
  if (!env.VAPID_PUBLIC_KEY || !env.VAPID_PRIVATE_KEY) return false;

  webpush.setVapidDetails(
    env.VAPID_SUBJECT ?? `mailto:noreply@udccerete.edu.co`,
    env.VAPID_PUBLIC_KEY,
    env.VAPID_PRIVATE_KEY,
  );
  configured = true;
  return true;
}

export function isWebPushAvailable(): boolean {
  return Boolean(env.VAPID_PUBLIC_KEY && env.VAPID_PRIVATE_KEY);
}

export async function sendWebPush(
  subscription: WebPushSubscription,
  payload: WebPushPayload,
): Promise<SendWebPushResult> {
  if (!ensureVapidConfigured()) {
    if (env.NODE_ENV !== 'production') {
      console.info('[web-push noop]', payload.title, subscription.endpoint);
    }
    return null;
  }

  const result = await webpush.sendNotification(
    subscription,
    JSON.stringify({
      title: payload.title,
      body: payload.body,
      url: payload.url ?? env.SITE_URL,
      icon: payload.icon,
    }),
  );

  return { statusCode: result.statusCode };
}

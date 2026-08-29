import { createRoute, type OpenAPIHono, z } from '@hono/zod-openapi';
import { API_NAME } from '../env.js';
import { apiErrorJson } from '../lib/openapi-responses.js';
import { requireDatabase } from '../middleware/database.js';
import type { AppBindings } from '../types.js';
import { listPosts } from '../services/posts.js';

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

async function generateFeed(): Promise<string> {
  const { items } = await listPosts({ page: 1, pageSize: 20, status: 'published' });
  const now = new Date().toUTCString();
  const entries = items
    .map((post) => {
      const link = `/posts/${post.slug}`;
      const pubDate = post.publishedAt ? new Date(post.publishedAt).toUTCString() : now;
      return [
        '<item>',
        `<title>${escapeXml(post.title)}</title>`,
        `<link>${escapeXml(link)}</link>`,
        `<guid isPermaLink="true">${escapeXml(link)}</guid>`,
        `<pubDate>${pubDate}</pubDate>`,
        post.excerpt ? `<description>${escapeXml(post.excerpt)}</description>` : '',
        '</item>',
      ].join('');
    })
    .join('');

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<rss version="2.0">',
    '<channel>',
    `<title>${escapeXml(API_NAME)}</title>`,
    `<description>${escapeXml('Publicaciones recientes')}</description>`,
    `<lastBuildDate>${now}</lastBuildDate>`,
    entries,
    '</channel>',
    '</rss>',
  ].join('');
}

const feedRoute = createRoute({
  method: 'get',
  path: '/feed.xml',
  tags: ['Feed'],
  summary: 'Feed RSS de publicaciones',
  responses: {
    200: {
      description: 'Feed RSS XML',
      content: {
        'application/xml': { schema: z.string().openapi({ type: 'string', format: 'binary' }) },
      },
    },
    503: { description: 'Base de datos no disponible', content: apiErrorJson },
  },
});

export function registerFeedRoutes(app: OpenAPIHono<AppBindings>) {
  app.use('/feed.xml', requireDatabase);

  app.openapi(feedRoute, async (c) => {
    const xml = await generateFeed();
    return c.body(xml, 200, { 'Content-Type': 'application/xml; charset=utf-8' });
  });
}

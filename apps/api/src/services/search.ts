import { and, desc, eq, ilike, isNull, or, sql } from 'drizzle-orm';
import {
  calendarActivities,
  events,
  getDb,
  posts,
  profiles,
  resources,
  searchZeroResults,
  wellbeingRoutes,
} from '@udccerete/db';
import { SearchQuerySchema, type SearchResult, z } from '@udccerete/schemas';
import { searchDocuments } from '../adapters/typesense.js';

type SearchQuery = {
  page: number;
  pageSize: number;
  from?: string;
  to?: string;
  q: string;
  type?: SearchResult['type'];
  category?: string;
  programId?: string;
};

type SearchResponse = {
  results: SearchResult[];
  degraded?: boolean;
  warning?: string;
};

async function searchSql(query: SearchQuery): Promise<SearchResult[]> {
  const db = getDb();
  const pattern = `%${query.q}%`;
  const results: SearchResult[] = [];
  const limit = query.pageSize;
  const skip = (query.page - 1) * query.pageSize;

  if (!query.type || query.type === 'post') {
    const rows = await db
      .select({ post: posts, author: profiles })
      .from(posts)
      .innerJoin(profiles, eq(posts.authorId, profiles.id))
      .where(
        and(
          eq(posts.status, 'published'),
          or(ilike(posts.title, pattern), ilike(posts.excerpt, pattern), ilike(posts.content, pattern))!,
        ),
      )
      .orderBy(desc(posts.publishedAt))
      .limit(limit);

    for (const row of rows) {
      results.push({
        type: 'post',
        id: row.post.id,
        title: row.post.title,
        excerpt: row.post.excerpt,
        url: `/posts/${row.post.slug}`,
        publishedAt: row.post.publishedAt?.toISOString() ?? null,
      });
    }
  }

  if ((!query.type || query.type === 'resource') && results.length < limit) {
    const rows = await db
      .select()
      .from(resources)
      .where(
        and(
          isNull(resources.archivedAt),
          or(ilike(resources.title, pattern), ilike(resources.description, pattern))!,
        ),
      )
      .orderBy(desc(resources.createdAt))
      .limit(limit - results.length);

    for (const row of rows) {
      results.push({
        type: 'resource',
        id: row.id,
        title: row.title,
        excerpt: row.description,
        url: `/resources/${row.id}`,
        publishedAt: row.createdAt.toISOString(),
      });
    }
  }

  if ((!query.type || query.type === 'event') && results.length < limit) {
    const rows = await db
      .select()
      .from(events)
      .where(
        and(
          eq(events.status, 'published'),
          or(ilike(events.title, pattern), ilike(events.description, pattern))!,
        ),
      )
      .orderBy(desc(events.startsAt))
      .limit(limit - results.length);

    for (const row of rows) {
      results.push({
        type: 'event',
        id: row.id,
        title: row.title,
        excerpt: row.description,
        url: `/events/${row.slug}`,
        publishedAt: row.startsAt.toISOString(),
      });
    }
  }

  if ((!query.type || query.type === 'calendar') && results.length < limit) {
    const rows = await db
      .select()
      .from(calendarActivities)
      .where(
        and(
          sql`${calendarActivities.status} != 'cancelled'`,
          or(
            ilike(calendarActivities.title, pattern),
            ilike(calendarActivities.description, pattern),
          )!,
        ),
      )
      .orderBy(desc(calendarActivities.startsAt))
      .limit(limit - results.length);

    for (const row of rows) {
      results.push({
        type: 'calendar',
        id: row.id,
        title: row.title,
        excerpt: row.description,
        url: `/calendar/${row.id}`,
        publishedAt: row.startsAt.toISOString(),
      });
    }
  }

  if ((!query.type || query.type === 'wellbeing') && results.length < limit) {
    const rows = await db
      .select()
      .from(wellbeingRoutes)
      .where(
        or(
          ilike(wellbeingRoutes.area, pattern),
          ilike(wellbeingRoutes.description, pattern),
          ilike(wellbeingRoutes.responsibleName, pattern),
        )!,
      )
      .limit(limit - results.length);

    for (const row of rows) {
      results.push({
        type: 'wellbeing',
        id: row.id,
        title: row.area,
        excerpt: row.description,
        url: '/wellbeing/routes',
        publishedAt: null,
      });
    }
  }

  return results.slice(skip, skip + limit);
}

export async function search(rawQuery: z.input<typeof SearchQuerySchema>): Promise<SearchResponse> {
  const query = SearchQuerySchema.parse(rawQuery) as SearchQuery;
  const typesenseResult = await searchDocuments({
    q: query.q,
    type: query.type,
    category: query.category,
    programId: query.programId,
    page: query.page,
    pageSize: query.pageSize,
  });

  if (!typesenseResult.degraded && typesenseResult.results.length > 0) {
    return { results: typesenseResult.results };
  }

  const results = await searchSql(query);

  if (results.length === 0) {
    const db = getDb();
    await db.insert(searchZeroResults).values({ query: query.q, filters: query.type ?? null });
  }

  return {
    results,
    degraded: true,
    warning:
      typesenseResult.warning ??
      'Búsqueda en modo degradado (SQL ILIKE); Typesense no disponible',
  };
}

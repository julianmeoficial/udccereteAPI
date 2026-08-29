import type { SearchResult } from '@udccerete/schemas';
import Typesense from 'typesense';
import { AppError } from '../lib/errors.js';
import { env, isTypesenseConfigured } from '../env.js';

export const TYPESENSE_COLLECTION = 'udccerete';

export type TypesenseDocument = SearchResult & {
  category?: string;
  programId?: string;
  content?: string;
};

export type SearchDocumentsInput = {
  q: string;
  type?: SearchResult['type'];
  category?: string;
  programId?: string;
  page?: number;
  pageSize?: number;
};

export type SearchDocumentsResult = {
  results: SearchResult[];
  degraded: boolean;
  warning?: string;
};

let client: InstanceType<typeof Typesense.Client> | null = null;

function getClient(): InstanceType<typeof Typesense.Client> | null {
  if (!isTypesenseConfigured()) return null;
  if (!client) {
    client = new Typesense.Client({
      nodes: [
        {
          host: env.TYPESENSE_HOST!,
          port: env.TYPESENSE_PORT ?? 8108,
          protocol: env.TYPESENSE_PROTOCOL ?? 'http',
        },
      ],
      apiKey: env.TYPESENSE_API_KEY!,
      connectionTimeoutSeconds: 5,
    });
  }
  return client;
}

export function isTypesenseAvailable(): boolean {
  return isTypesenseConfigured();
}

function buildFilter(input: SearchDocumentsInput): string | undefined {
  const filters: string[] = [];
  if (input.type) filters.push(`type:=${input.type}`);
  if (input.category) filters.push(`category:=${input.category}`);
  if (input.programId) filters.push(`programId:=${input.programId}`);
  return filters.length > 0 ? filters.join(' && ') : undefined;
}

export async function searchDocuments(input: SearchDocumentsInput): Promise<SearchDocumentsResult> {
  const typesense = getClient();
  if (!typesense) {
    return {
      results: [],
      degraded: true,
      warning: 'Búsqueda no configurada',
    };
  }

  const page = input.page ?? 1;
  const perPage = input.pageSize ?? 20;

  try {
    const response = await typesense
      .collections<TypesenseDocument>(TYPESENSE_COLLECTION)
      .documents()
      .search({
        q: input.q,
        query_by: 'title,excerpt,content',
        filter_by: buildFilter(input),
        page,
        per_page: perPage,
        highlight_full_fields: 'title,excerpt',
      });

    const results: SearchResult[] = (response.hits ?? []).map((hit) => {
      const doc = hit.document;
      const highlights = hit.highlights?.flatMap((h) => h.snippet ?? h.value ?? []) ?? [];
      return {
        type: doc.type,
        id: doc.id,
        title: doc.title,
        excerpt: doc.excerpt,
        url: doc.url,
        publishedAt: doc.publishedAt,
        highlights: highlights.length > 0 ? highlights : undefined,
      };
    });

    return { results, degraded: false };
  } catch (err) {
    console.error('[typesense] search failed', err);
    return {
      results: [],
      degraded: true,
      warning: 'Búsqueda temporalmente no disponible',
    };
  }
}

export async function indexDocument(document: TypesenseDocument): Promise<boolean> {
  const typesense = getClient();
  if (!typesense) return false;

  await typesense.collections(TYPESENSE_COLLECTION).documents().upsert(document);
  return true;
}

export async function indexDocumentOrThrow(document: TypesenseDocument): Promise<void> {
  const indexed = await indexDocument(document);
  if (!indexed) {
    throw new AppError('SERVICE_DEGRADED', 'Búsqueda no configurada');
  }
}

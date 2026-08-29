import {
  CitationStyleSchema,
  CreateCitationSchema,
  type CitationResult,
  z,
} from '@udccerete/schemas';
import { AppError } from '../lib/errors.js';

type CitationStyle = z.infer<typeof CitationStyleSchema>;
type CreateCitation = z.infer<typeof CreateCitationSchema>;

type CrossrefAuthor = { given?: string; family?: string; name?: string };
type CrossrefWork = {
  title?: string[];
  author?: CrossrefAuthor[];
  'container-title'?: string[];
  published?: { 'date-parts'?: number[][] };
  'published-print'?: { 'date-parts'?: number[][] };
  volume?: string;
  issue?: string;
  page?: string;
  DOI?: string;
};

function extractDoi(input: CreateCitation): string {
  if (input.doi) return input.doi.replace(/^https?:\/\/doi\.org\//i, '');
  if (input.url) {
    const match = input.url.match(/10\.\d{4,9}\/[^\s?#]+/i);
    if (match) return match[0];
  }
  throw new AppError('VALIDATION_ERROR', 'No se pudo extraer un DOI válido');
}

function formatAuthorsApa(authors: CrossrefAuthor[] | undefined): string {
  if (!authors?.length) return 'Autor desconocido';
  return authors
    .slice(0, 20)
    .map((a) => {
      if (a.name) return a.name;
      const family = a.family ?? '';
      const given = a.given ? `${a.given.charAt(0)}.` : '';
      return `${family}, ${given}`.trim();
    })
    .join(', ');
}

function formatAuthorsVancouver(authors: CrossrefAuthor[] | undefined): string {
  if (!authors?.length) return 'Autor desconocido';
  return authors
    .slice(0, 6)
    .map((a) => {
      if (a.name) return a.name;
      const family = a.family ?? '';
      const initials = (a.given ?? '')
        .split(/\s+/)
        .map((part) => part.charAt(0).toUpperCase())
        .join('');
      return `${family} ${initials}`.trim();
    })
    .join(', ');
}

function extractYear(work: CrossrefWork): string {
  const parts =
    work.published?.['date-parts']?.[0] ??
    work['published-print']?.['date-parts']?.[0];
  return parts?.[0]?.toString() ?? 's.f.';
}

function formatApa7(work: CrossrefWork, doi: string): string {
  const authors = formatAuthorsApa(work.author);
  const year = extractYear(work);
  const title = work.title?.[0] ?? 'Sin título';
  const journal = work['container-title']?.[0];
  const volume = work.volume;
  const issue = work.issue;
  const pages = work.page;

  let citation = `${authors} (${year}). ${title}.`;
  if (journal) {
    citation += ` ${journal}`;
    if (volume) citation += `, ${volume}`;
    if (issue) citation += `(${issue})`;
    if (pages) citation += `, ${pages}`;
    citation += '.';
  }
  citation += ` https://doi.org/${doi}`;
  return citation;
}

function formatVancouver(work: CrossrefWork, doi: string): string {
  const authors = formatAuthorsVancouver(work.author);
  const year = extractYear(work);
  const title = work.title?.[0] ?? 'Sin título';
  const journal = work['container-title']?.[0];
  const volume = work.volume;
  const issue = work.issue;
  const pages = work.page;

  let citation = `${authors}. ${title}.`;
  if (journal) {
    citation += ` ${journal}.`;
    if (year) citation += ` ${year};`;
    if (volume) citation += `${volume}`;
    if (issue) citation += `(${issue})`;
    if (pages) citation += `:${pages}`;
    citation += '.';
  }
  citation += ` doi:${doi}`;
  return citation;
}

function formatCitation(work: CrossrefWork, doi: string, style: CitationStyle): string {
  return style === 'vancouver' ? formatVancouver(work, doi) : formatApa7(work, doi);
}

async function fetchCrossrefWork(doi: string): Promise<CrossrefWork> {
  const response = await fetch(`https://api.crossref.org/works/${encodeURIComponent(doi)}`, {
    headers: { Accept: 'application/json' },
  });

  if (!response.ok) {
    throw new AppError('NOT_FOUND', 'No se encontró la referencia en Crossref');
  }

  const payload = (await response.json()) as { message?: CrossrefWork };
  if (!payload.message) {
    throw new AppError('NOT_FOUND', 'Respuesta inválida de Crossref');
  }
  return payload.message;
}

export async function resolveCitation(input: CreateCitation): Promise<CitationResult> {
  const doi = extractDoi(input);
  const work = await fetchCrossrefWork(doi);

  return {
    style: input.style,
    formatted: formatCitation(work, doi, input.style),
    metadata: work as Record<string, unknown>,
    source: 'crossref',
  };
}

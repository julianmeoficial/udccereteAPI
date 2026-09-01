import { describe, expect, it } from 'vitest';
import { appErrorFromPostgres, asPostgresError } from '../apps/api/src/lib/postgres-errors.js';
import { resolvePostsListQuery } from '../apps/api/src/lib/posts-query.js';

describe('postgres error mapping', () => {
  it('maps unique violation to CONFLICT', () => {
    const err = asPostgresError({ code: '23505', constraint_name: 'posts_slug_unique' });
    expect(err).not.toBeNull();
    expect(appErrorFromPostgres(err!)).toEqual({
      code: 'CONFLICT',
      message: 'El recurso ya existe',
    });
  });

  it('maps foreign key violation to NOT_FOUND', () => {
    const err = asPostgresError({ code: '23503' });
    expect(appErrorFromPostgres(err!)).toEqual({
      code: 'NOT_FOUND',
      message: 'Recurso relacionado no encontrado',
    });
  });

  it('ignores non-postgres errors', () => {
    expect(asPostgresError(new Error('boom'))).toBeNull();
  });
});

describe('public posts list query', () => {
  const baseQuery = { page: 1, pageSize: 10 };

  it('forces published for anonymous users', () => {
    expect(resolvePostsListQuery(baseQuery)).toEqual({
      ...baseQuery,
      status: 'published',
    });
  });

  it('forces published for visitors', () => {
    expect(
      resolvePostsListQuery(baseQuery, {
        sub: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaa003',
        email: 'visitante@gmail.com',
        role: 'visitor',
        centerId: null,
        programId: null,
      }),
    ).toEqual({
      ...baseQuery,
      status: 'published',
    });
  });

  it('allows editors to request drafts', () => {
    const query = { ...baseQuery, status: 'draft' as const };
    expect(
      resolvePostsListQuery(query, {
        sub: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaa001',
        email: 'editor@unicartagena.edu.co',
        role: 'editor',
        centerId: null,
        programId: null,
      }),
    ).toEqual(query);
  });
});

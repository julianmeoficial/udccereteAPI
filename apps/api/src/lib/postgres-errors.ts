type PostgresErrorLike = {
  code: string;
  constraint_name?: string;
  detail?: string;
};

export function asPostgresError(err: unknown): PostgresErrorLike | null {
  if (typeof err !== 'object' || err === null || !('code' in err)) {
    return null;
  }
  const code = (err as { code: unknown }).code;
  if (typeof code !== 'string') return null;
  return err as PostgresErrorLike;
}

export function appErrorFromPostgres(err: PostgresErrorLike): {
  code: 'CONFLICT' | 'NOT_FOUND';
  message: string;
} | null {
  switch (err.code) {
    case '23505':
      return { code: 'CONFLICT', message: 'El recurso ya existe' };
    case '23503':
      return { code: 'NOT_FOUND', message: 'Recurso relacionado no encontrado' };
    default:
      return null;
  }
}

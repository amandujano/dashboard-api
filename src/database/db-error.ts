import { HttpException } from '@nestjs/common';

type PgLikeError = {
  code?: unknown;
  message?: unknown;
  cause?: unknown;
};

/**
 * Drizzle wraps driver failures in a DrizzleQueryError whose `cause` is the
 * original postgres-js error, so the SQLSTATE code may live on either level.
 */
export function pgErrorCode(error: unknown): string | undefined {
  let current: unknown = error;
  for (let depth = 0; depth < 3 && current; depth++) {
    const { code, cause } = current as PgLikeError;
    if (typeof code === 'string') return code;
    current = cause;
  }
  return undefined;
}

/**
 * Returns the driver-level message (without the "Failed query: ..." SQL dump
 * that Drizzle puts on the wrapper error).
 */
export function pgErrorMessage(error: unknown): string {
  const { cause, message } = (error ?? {}) as PgLikeError;
  const inner = (cause ?? {}) as PgLikeError;
  if (typeof inner.message === 'string') return inner.message;
  return typeof message === 'string' ? message : 'Database error';
}

/** Awaits a query and rethrows any failure as the given HTTP exception. */
export async function orFail<T>(
  query: PromiseLike<T>,
  toException: (message: string) => HttpException,
): Promise<T> {
  try {
    return await query;
  } catch (error) {
    throw toException(pgErrorMessage(error));
  }
}

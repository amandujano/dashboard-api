/**
 * Minimal stand-in for the Drizzle client used in unit tests.
 *
 * Every builder method returns the same chainable object; awaiting the chain
 * resolves with the next queued result (or rejects if it is an Error).
 */
export function createMockDb(...results: unknown[]) {
  const queue = [...results];

  const chain: unknown = new Proxy(() => chain, {
    get: (_target, prop) => {
      if (prop === 'then') {
        return (
          resolve: (value: unknown) => void,
          reject: (reason: unknown) => void,
        ) => {
          const next = queue.shift();
          if (next instanceof Error) reject(next);
          else resolve(next);
        };
      }
      return () => chain;
    },
    apply: () => chain,
  });

  // The root must not be thenable, otherwise Nest would await it when
  // resolving the provider and consume a queued result.
  return {
    select: () => chain,
    insert: () => chain,
    update: () => chain,
    delete: () => chain,
  };
}

/** Mimics DrizzleQueryError: the SQLSTATE lives on `cause`. */
export function driverError(message: string, code?: string) {
  const error = new Error(`Failed query: select ...`);
  (error as Error & { cause?: unknown }).cause = Object.assign(
    new Error(message),
    { code },
  );
  return error;
}

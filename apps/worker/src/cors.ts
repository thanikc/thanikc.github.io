const LOCAL_DEV_ORIGIN = 'http://localhost:4200';

/**
 * Echoes the request origin back when it is allowed (the configured site origin or
 * the local Angular dev server), otherwise falls back to the configured origin.
 */
export function resolveOrigin(requestOrigin: string | undefined, allowedOrigin: string): string {
  const allowList = new Set([allowedOrigin, LOCAL_DEV_ORIGIN]);
  return requestOrigin && allowList.has(requestOrigin) ? requestOrigin : allowedOrigin;
}

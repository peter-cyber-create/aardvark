import { NextResponse } from 'next/server';

type CacheControlOptions = {
  public?: boolean;
  maxAge?: number; // in seconds
  staleWhileRevalidate?: number; // in seconds
  mustRevalidate?: boolean;
};

export function withCacheControl(response: NextResponse, options: CacheControlOptions) {
  const {
    public: isPublic = false,
    maxAge = 0,
    staleWhileRevalidate = 0,
    mustRevalidate = true,
  } = options;

  const directives = [
    isPublic ? 'public' : 'private',
    `max-age=${maxAge}`,
    staleWhileRevalidate > 0 ? `stale-while-revalidate=${staleWhileRevalidate}` : null,
    mustRevalidate ? 'must-revalidate' : null,
  ].filter(Boolean);

  response.headers.set('Cache-Control', directives.join(', '));
  return response;
}

// Common cache configurations
export const cacheConfigs = {
  dynamic: { maxAge: 0, mustRevalidate: true }, // For dynamic data
  static: { public: true, maxAge: 3600, staleWhileRevalidate: 300 }, // For static data
  authenticated: { maxAge: 0, mustRevalidate: true }, // For authenticated routes
};

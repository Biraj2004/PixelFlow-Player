type RateLimitBucket = {
  count: number;
  windowStartMs: number;
};

type RateLimitStore = Map<string, RateLimitBucket>;

const getRateLimitStore = (): RateLimitStore => {
  const scope = globalThis as typeof globalThis & {
    __pixelflowRateLimitStore?: RateLimitStore;
  };

  if (!scope.__pixelflowRateLimitStore) {
    scope.__pixelflowRateLimitStore = new Map();
  }

  return scope.__pixelflowRateLimitStore;
};

export const getClientAddress = (headers: Headers): string => {
  const forwarded = headers.get('x-forwarded-for')?.split(',')[0]?.trim();
  const realIp = headers.get('x-real-ip')?.trim();

  return forwarded || realIp || 'unknown';
};

export const checkRateLimit = (args: {
  key: string;
  limit: number;
  windowMs: number;
}): { allowed: boolean; remaining: number; resetAtMs: number } => {
  const { key, limit, windowMs } = args;
  const now = Date.now();
  const store = getRateLimitStore();
  const bucket = store.get(key);

  if (!bucket || now - bucket.windowStartMs >= windowMs) {
    store.set(key, {
      count: 1,
      windowStartMs: now,
    });

    return {
      allowed: true,
      remaining: Math.max(0, limit - 1),
      resetAtMs: now + windowMs,
    };
  }

  if (bucket.count >= limit) {
    return {
      allowed: false,
      remaining: 0,
      resetAtMs: bucket.windowStartMs + windowMs,
    };
  }

  bucket.count += 1;
  store.set(key, bucket);

  return {
    allowed: true,
    remaining: Math.max(0, limit - bucket.count),
    resetAtMs: bucket.windowStartMs + windowMs,
  };
};

const stripTokenLikeParams = (url: URL): URL => {
  const SENSITIVE_KEYS = ['token', 'sig', 'signature', 'expires', 'policy', 'key', 'auth', 'jwt', 'hdnea', 'x-amz-signature'];

  SENSITIVE_KEYS.forEach((key) => {
    const keys = Array.from(url.searchParams.keys());
    keys.forEach((existing) => {
      if (existing.toLowerCase().includes(key)) {
        url.searchParams.delete(existing);
      }
    });
  });

  return url;
};

export const redactUrl = (rawUrl: string): string => {
  if (!rawUrl.trim()) {
    return '';
  }

  try {
    const parsed = new URL(rawUrl);
    const sanitized = stripTokenLikeParams(parsed);
    return `${sanitized.origin}${sanitized.pathname}`;
  } catch {
    return rawUrl.split('?')[0] ?? rawUrl;
  }
};

import type { SourceResolution } from './types';

const TERABOX_HOST_MARKERS = [
  'terabox',
  '1024tera',
  'nephobox',
  '4funbox',
  'momerybox',
  'teraboxapp',
] as const;

const MEDIA_EXTENSIONS = ['.m3u8', '.mpd', '.mp4', '.mkv'] as const;

const PIXELDRAIN_HOST_MARKERS = ['pixeldrain.com'] as const;

type ResolvePlayableSourceResult = {
  url: string;
  sourceResolution: SourceResolution;
};

export class SourceResolutionError extends Error {
  sourceResolution: SourceResolution;

  constructor(message: string, sourceResolution: SourceResolution) {
    super(message);
    this.name = 'SourceResolutionError';
    this.sourceResolution = sourceResolution;
  }
}

const looksLikeDirectMediaPath = (pathname: string): boolean => {
  const normalized = pathname.toLowerCase();
  return MEDIA_EXTENSIONS.some((ext) => normalized.endsWith(ext));
};

export const isTeraBoxUrl = (rawUrl: string): boolean => {
  try {
    const parsed = new URL(rawUrl);
    const host = parsed.hostname.toLowerCase();
    return TERABOX_HOST_MARKERS.some((marker) => host.includes(marker));
  } catch {
    return false;
  }
};

export const isPixeldrainUrl = (rawUrl: string): boolean => {
  try {
    const parsed = new URL(rawUrl);
    const host = parsed.hostname.toLowerCase();
    return PIXELDRAIN_HOST_MARKERS.some((marker) => host === marker || host.endsWith(`.${marker}`));
  } catch {
    return false;
  }
};

export const buildSourceStatusLabel = (sourceResolution: Pick<SourceResolution, 'provider' | 'status'>): string => {
  if (sourceResolution.provider === 'terabox' && sourceResolution.status === 'resolved') {
    return 'TeraBox link resolved';
  }

  if (sourceResolution.provider === 'terabox' && sourceResolution.status === 'auth_required') {
    return 'TeraBox requires authenticated browser session';
  }

  if (sourceResolution.provider === 'pixeldrain' && sourceResolution.status === 'resolved') {
    return 'Pixeldrain link resolved';
  }

  if (sourceResolution.provider === 'pixeldrain' && sourceResolution.status === 'auth_required') {
    return 'Pixeldrain requires authenticated browser session';
  }

  return '';
};

const decodeEscapedText = (value: string): string => {
  return value
    .replace(/\\\//g, '/')
    .replace(/\\u([0-9a-fA-F]{4})/g, (_, hex: string) => String.fromCharCode(Number.parseInt(hex, 16)));
};

const normalizeCandidate = (candidate: string): string | null => {
  const decoded = decodeEscapedText(candidate.trim()).replace(/[<>'"\s]+$/g, '');

  if (!decoded) {
    return null;
  }

  if (decoded.startsWith('//')) {
    return `https:${decoded}`;
  }

  return decoded;
};

export const extractPlayableFromTeraboxHtml = (html: string): string | null => {
  const patterns = [
    /"dlink"\s*:\s*"([^"]+)"/i,
    /"downloadLink"\s*:\s*"([^"]+)"/i,
    /['"](?:dlink|downloadLink|playUrl|play_url|videoUrl|video_url)['"]\s*:\s*['"]([^'"]+)['"]/i,
    /(https?:\/\/[^"'<\\\s]+\.(?:m3u8|mpd|mp4|mkv)(?:\?[^"'<\\\s]*)?)/i,
    /(\/\/[^"'<\\\s]+\.(?:m3u8|mpd|mp4|mkv)(?:\?[^"'<\\\s]*)?)/i,
  ] as const;

  for (const pattern of patterns) {
    const match = html.match(pattern);
    const candidate = match?.[1];
    if (!candidate) {
      continue;
    }

    const normalized = normalizeCandidate(candidate);
    if (!normalized) {
      continue;
    }

    try {
      const parsed = new URL(normalized);
      if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
        parsed.pathname = parsed.pathname.replace(/\.(m3u8|mpd|mp4|mkv)\/$/i, '.$1');
        return parsed.toString();
      }
    } catch {
      // Ignore malformed candidates and continue scanning.
    }
  }

  return null;
};

const isLikelyMediaContentType = (contentType: string): boolean => {
  const value = contentType.toLowerCase();
  return value.includes('video/')
    || value.includes('application/vnd.apple.mpegurl')
    || value.includes('application/x-mpegurl')
    || value.includes('application/dash+xml')
    || value.includes('application/octet-stream');
};

export const resolvePixeldrainSource = (rawUrl: string): ResolvePlayableSourceResult | null => {
  if (!isPixeldrainUrl(rawUrl)) {
    return null;
  }

  const parsed = new URL(rawUrl);
  const normalizedPath = parsed.pathname.replace(/\/$/, '');

  const sharedFileMatch = normalizedPath.match(/^\/(?:u|d)\/([a-zA-Z0-9_-]+)$/);
  if (sharedFileMatch) {
    const fileId = sharedFileMatch[1];
    return {
      url: `${parsed.origin}/api/file/${fileId}?download`,
      sourceResolution: {
        provider: 'pixeldrain',
        status: 'resolved',
      },
    };
  }

  const apiFileMatch = normalizedPath.match(/^\/api\/file\/([a-zA-Z0-9_-]+)$/);
  if (apiFileMatch) {
    const fileId = apiFileMatch[1];
    return {
      url: `${parsed.origin}/api/file/${fileId}?download`,
      sourceResolution: {
        provider: 'pixeldrain',
        status: 'resolved',
      },
    };
  }

  return {
    url: parsed.toString(),
    sourceResolution: {
      provider: 'pixeldrain',
      status: 'auth_required',
    },
  };
};

export const resolvePlayableSource = async (rawUrl: string): Promise<ResolvePlayableSourceResult> => {
  const pixeldrainResult = resolvePixeldrainSource(rawUrl);
  if (pixeldrainResult) {
    const label = buildSourceStatusLabel(pixeldrainResult.sourceResolution);
    return {
      ...pixeldrainResult,
      sourceResolution: {
        ...pixeldrainResult.sourceResolution,
        label,
      },
    };
  }

  if (!isTeraBoxUrl(rawUrl)) {
    return {
      url: rawUrl,
      sourceResolution: {
        provider: 'direct',
        status: 'none',
      },
    };
  }

  const parsed = new URL(rawUrl);
  if (looksLikeDirectMediaPath(parsed.pathname)) {
    return {
      url: parsed.toString(),
      sourceResolution: {
        provider: 'terabox',
        status: 'resolved',
        label: buildSourceStatusLabel({ provider: 'terabox', status: 'resolved' }),
      },
    };
  }

  const response = await fetch(parsed.toString(), {
    method: 'GET',
    redirect: 'follow',
    cache: 'no-store',
    headers: {
      'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
      'accept-language': 'en-US,en;q=0.9',
      referer: `${parsed.protocol}//${parsed.host}/`,
    },
  });

  const contentType = response.headers.get('content-type') ?? '';
  const contentDisposition = response.headers.get('content-disposition') ?? '';
  const finalUrl = response.url || parsed.toString();
  const finalUrlLooksLikeMedia = (() => {
    try {
      return looksLikeDirectMediaPath(new URL(finalUrl).pathname);
    } catch {
      return false;
    }
  })();
  const dispositionLooksLikeMedia = /\.(m3u8|mpd|mp4|mkv)(?:"|;|$)/i.test(contentDisposition);

  if (response.ok && (isLikelyMediaContentType(contentType) || finalUrlLooksLikeMedia || dispositionLooksLikeMedia)) {
    return {
      url: finalUrl,
      sourceResolution: {
        provider: 'terabox',
        status: 'resolved',
        label: buildSourceStatusLabel({ provider: 'terabox', status: 'resolved' }),
      },
    };
  }

  const html = await response.text();
  const extracted = extractPlayableFromTeraboxHtml(html);

  if (extracted) {
    return {
      url: extracted,
      sourceResolution: {
        provider: 'terabox',
        status: 'resolved',
        label: buildSourceStatusLabel({ provider: 'terabox', status: 'resolved' }),
      },
    };
  }

  throw new SourceResolutionError(
    'TeraBox share link detected, but direct playback could not be resolved. TeraBox requires authenticated browser session.',
    {
      provider: 'terabox',
      status: 'auth_required',
      label: buildSourceStatusLabel({ provider: 'terabox', status: 'auth_required' }),
    },
  );
};

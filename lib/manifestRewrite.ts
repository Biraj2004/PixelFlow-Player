const PROXY_PATH = '/api/stream';

const toAbsoluteUrl = (value: string, manifestUrl: string): string | null => {
  const trimmed = value.trim();

  if (!trimmed || trimmed.startsWith('#') || trimmed.startsWith('data:')) {
    return null;
  }

  if (trimmed.startsWith(`${PROXY_PATH}?url=`)) {
    return null;
  }

  try {
    return new URL(trimmed, manifestUrl).toString();
  } catch {
    return null;
  }
};

const toProxyUrl = (absoluteUrl: string): string => {
  return `${PROXY_PATH}?url=${encodeURIComponent(absoluteUrl)}`;
};

const rewriteM3u8Line = (line: string, manifestUrl: string): string => {
  const trimmed = line.trim();

  if (!trimmed) {
    return line;
  }

  if (trimmed.startsWith('#')) {
    return line.replace(/URI="([^"]+)"/g, (full, uriValue: string) => {
      const absolute = toAbsoluteUrl(uriValue, manifestUrl);
      if (!absolute) {
        return full;
      }

      return `URI="${toProxyUrl(absolute)}"`;
    });
  }

  const absolute = toAbsoluteUrl(trimmed, manifestUrl);
  if (!absolute) {
    return line;
  }

  return toProxyUrl(absolute);
};

const rewriteMpd = (manifest: string, manifestUrl: string): string => {
  const rewriteAttribute = (value: string): string => {
    const absolute = toAbsoluteUrl(value, manifestUrl);
    return absolute ? toProxyUrl(absolute) : value;
  };

  const withAttributes = manifest.replace(
    /(href|src|sourceURL|media|initialization)="([^"]+)"/g,
    (_full, attribute: string, value: string) => `${attribute}="${rewriteAttribute(value)}"`,
  );

  return withAttributes.replace(/<BaseURL>([^<]+)<\/BaseURL>/g, (_full, value: string) => {
    const absolute = toAbsoluteUrl(value, manifestUrl);
    if (!absolute) {
      return `<BaseURL>${value}</BaseURL>`;
    }

    return `<BaseURL>${toProxyUrl(absolute)}</BaseURL>`;
  });
};

export const isManifestContent = (sourceUrl: string, contentType: string): boolean => {
  const normalizedUrl = sourceUrl.split('?')[0]?.toLowerCase() ?? '';
  const normalizedType = contentType.toLowerCase();

  return (
    normalizedUrl.endsWith('.m3u8') ||
    normalizedUrl.endsWith('.mpd') ||
    normalizedType.includes('application/vnd.apple.mpegurl') ||
    normalizedType.includes('application/x-mpegurl') ||
    normalizedType.includes('application/dash+xml') ||
    normalizedType.includes('application/xml')
  );
};

export const rewriteManifest = (manifest: string, manifestUrl: string, contentType: string): string => {
  const normalizedUrl = manifestUrl.split('?')[0]?.toLowerCase() ?? '';
  const normalizedType = contentType.toLowerCase();

  const isHls =
    normalizedUrl.endsWith('.m3u8') ||
    normalizedType.includes('application/vnd.apple.mpegurl') ||
    normalizedType.includes('application/x-mpegurl');

  if (isHls) {
    return manifest
      .split(/\r?\n/)
      .map((line) => rewriteM3u8Line(line, manifestUrl))
      .join('\n');
  }

  return rewriteMpd(manifest, manifestUrl);
};

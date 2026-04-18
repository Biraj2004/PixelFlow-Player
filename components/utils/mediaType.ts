export type MediaType = 'mp4' | 'mkv' | 'hls' | 'dash' | 'unknown';

export const detectMediaType = (url: string): MediaType => {
  const normalized = url.split('?')[0]?.toLowerCase() ?? '';

  if (normalized.endsWith('.m3u8')) {
    return 'hls';
  }

  if (normalized.endsWith('.mpd')) {
    return 'dash';
  }

  if (normalized.endsWith('.mp4')) {
    return 'mp4';
  }

  if (normalized.endsWith('.mkv')) {
    return 'mkv';
  }

  return 'unknown';
};

export const detectMediaTypeFromContentType = (contentType: string): MediaType => {
  const normalized = contentType.toLowerCase();

  if (!normalized) {
    return 'unknown';
  }

  if (normalized.includes('application/vnd.apple.mpegurl') || normalized.includes('application/x-mpegurl')) {
    return 'hls';
  }

  if (normalized.includes('application/dash+xml')) {
    return 'dash';
  }

  if (normalized.includes('video/mp4')) {
    return 'mp4';
  }

  if (normalized.includes('video/x-matroska') || normalized.includes('video/webm')) {
    return 'mkv';
  }

  return 'unknown';
};

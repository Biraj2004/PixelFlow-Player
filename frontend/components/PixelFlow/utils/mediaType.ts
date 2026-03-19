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

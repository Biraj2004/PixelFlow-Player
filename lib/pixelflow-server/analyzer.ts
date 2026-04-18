import type { MediaType, StreamMetadata } from './types';

const detectType = (url: string): MediaType => {
  const normalized = url.split('?')[0]?.toLowerCase() ?? '';

  if (normalized.endsWith('.m3u8')) return 'hls';
  if (normalized.endsWith('.mpd')) return 'dash';
  if (normalized.endsWith('.mp4')) return 'mp4';
  if (normalized.endsWith('.mkv')) return 'mkv';

  return 'unknown';
};

const detectTypeFromContentType = (contentType: string): MediaType => {
  const value = contentType.toLowerCase();

  if (!value) {
    return 'unknown';
  }

  if (value.includes('application/vnd.apple.mpegurl') || value.includes('application/x-mpegurl')) {
    return 'hls';
  }

  if (value.includes('application/dash+xml')) {
    return 'dash';
  }

  if (value.includes('video/mp4')) {
    return 'mp4';
  }

  if (value.includes('video/x-matroska') || value.includes('video/webm')) {
    return 'mkv';
  }

  return 'unknown';
};

const inferCodecs = (contentType: string, mediaType: MediaType): Pick<StreamMetadata, 'videoCodec' | 'audioCodec'> => {
  const value = contentType.toLowerCase();
  const videoCodec = value.includes('hevc') || value.includes('h265') || mediaType === 'mkv' ? 'hevc' : 'h264';
  const audioCodec = value.includes('ec-3') || value.includes('eac3') ? 'eac3' : 'aac';

  return { videoCodec, audioCodec };
};

export const analyzeStream = async (url: string): Promise<StreamMetadata> => {
  let mediaType = detectType(url);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 7_000);

  let contentType = '';
  let hasSubtitles = false;

  try {
    const response = await fetch(url, {
      method: 'HEAD',
      redirect: 'follow',
      signal: controller.signal,
      headers: {
        'user-agent': 'PixelFlow/1.0',
      },
      cache: 'no-store',
    });

    contentType = response.headers.get('content-type') ?? '';
    const linkHeader = response.headers.get('link') ?? '';
    hasSubtitles = /vtt|srt|subtitle/i.test(linkHeader);
  } catch {
    // Continue with inferred metadata when remote HEAD is unavailable.
  } finally {
    clearTimeout(timeout);
  }

  if (mediaType === 'unknown') {
    mediaType = detectTypeFromContentType(contentType);
  }

  const { videoCodec, audioCodec } = inferCodecs(contentType, mediaType);

  return {
    type: mediaType,
    videoCodec,
    audioCodec,
    duration: null,
    hasAudio: true,
    hasSubtitles,
    contentType,
  };
};

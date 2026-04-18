import type { PlaybackAnalysisResult } from '../types';
import { detectMediaType, detectMediaTypeFromContentType } from '../utils/mediaType';

const SUPPORTED_FORMATS: PlaybackAnalysisResult['supportedFormats'] = ['hls', 'dash', 'mp4', 'mkv'];

const isHttpUrl = (value: string): boolean => /^https?:\/\//i.test(value);

const buildAbsolutePlayableUrl = (playableUrl: string): string => {
  if (isHttpUrl(playableUrl)) {
    return playableUrl;
  }

  return playableUrl.startsWith('/') ? playableUrl : `/api/stream?url=${encodeURIComponent(playableUrl)}`;
};

const tryBackendAnalyze = async (url: string): Promise<PlaybackAnalysisResult | null> => {
  const response = await fetch('/api/analyze', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ url }),
  });

  if (!response.ok) {
    return null;
  }

  const payload = (await response.json()) as {
    success?: boolean;
    strategy?: 'direct' | 'proxy' | 'transcode' | 'error';
    playableUrl?: string;
    metadata?: {
      type?: PlaybackAnalysisResult['currentFormat'];
      contentType?: string;
    };
    error?: string;
  };

  const metadataType = payload.metadata?.type;
  const typeFromContent = detectMediaTypeFromContentType(payload.metadata?.contentType ?? '');
  const currentFormat = metadataType && metadataType !== 'unknown'
    ? metadataType
    : (typeFromContent !== 'unknown' ? typeFromContent : detectMediaType(url));

  if (!payload.success || !payload.strategy) {
    return {
      shouldProceed: false,
      playbackUrl: url,
      decision: 'error',
      severity: 'error',
      message: payload.error || 'Analyze failed. Unable to determine safe playback strategy.',
      currentFormat,
      supportedFormats: SUPPORTED_FORMATS,
    };
  }

  const playbackUrl = buildAbsolutePlayableUrl(payload.playableUrl || url);

  if (payload.strategy === 'direct') {
    return {
      shouldProceed: true,
      playbackUrl,
      decision: 'direct',
      severity: 'success',
      message: 'Analysis complete: direct playback selected.',
      currentFormat,
      supportedFormats: SUPPORTED_FORMATS,
    };
  }

  if (payload.strategy === 'proxy') {
    return {
      shouldProceed: true,
      playbackUrl,
      decision: 'proxy',
      severity: 'warning',
      message: 'Analysis complete: proxy playback selected due to network/CORS constraints.',
      currentFormat,
      supportedFormats: SUPPORTED_FORMATS,
    };
  }

  if (payload.strategy === 'transcode') {
    return {
      shouldProceed: true,
      playbackUrl,
      decision: 'transcode',
      severity: 'warning',
      message: 'Analysis complete: transcoding path selected for codec compatibility.',
      currentFormat,
      supportedFormats: SUPPORTED_FORMATS,
    };
  }

  return {
    shouldProceed: false,
    playbackUrl,
    decision: 'error',
    severity: 'error',
    message: 'Analysis complete: stream marked non-playable.',
    currentFormat,
    supportedFormats: SUPPORTED_FORMATS,
  };
};

export const analyzePlaybackSource = async (url: string): Promise<PlaybackAnalysisResult> => {
  const normalized = url.trim();

  if (!normalized) {
    return {
      shouldProceed: false,
      playbackUrl: '',
      decision: 'error',
      severity: 'error',
      message: 'No URL provided for analysis.',
      currentFormat: 'unknown',
      supportedFormats: SUPPORTED_FORMATS,
    };
  }

  if (!isHttpUrl(normalized)) {
    return {
      shouldProceed: false,
      playbackUrl: normalized,
      decision: 'error',
      severity: 'error',
      message: 'Invalid URL. Please provide an http or https media link.',
      currentFormat: 'unknown',
      supportedFormats: SUPPORTED_FORMATS,
    };
  }

  try {
    const backendResult = await tryBackendAnalyze(normalized);
    if (backendResult) {
      return backendResult;
    }
  } catch {
    // Fall back to client-side heuristics when backend analysis is unavailable.
  }

  const mediaType = detectMediaType(normalized);
  const host = typeof window !== 'undefined' ? window.location.hostname : '';
  const corsRisk = host ? !normalized.includes(host) : true;

  if (mediaType === 'unknown') {
    return {
      shouldProceed: false,
      playbackUrl: normalized,
      decision: 'error',
      severity: 'error',
      message: 'Analysis: unknown media format. Provide mp4, mkv, m3u8, or mpd.',
      currentFormat: mediaType,
      supportedFormats: SUPPORTED_FORMATS,
    };
  }

  if (mediaType === 'mkv') {
    return {
      shouldProceed: true,
      playbackUrl: normalized,
      decision: 'transcode',
      severity: 'warning',
      message: 'Analysis: MKV detected. Playback will try fallback chain and may require transcoding.',
      currentFormat: mediaType,
      supportedFormats: SUPPORTED_FORMATS,
    };
  }

  if (corsRisk) {
    return {
      shouldProceed: true,
      playbackUrl: normalized,
      decision: 'proxy',
      severity: 'warning',
      message: 'Analysis: cross-origin source detected. Playback starts now and may require proxy fallback.',
      currentFormat: mediaType,
      supportedFormats: SUPPORTED_FORMATS,
    };
  }

  return {
    shouldProceed: true,
    playbackUrl: normalized,
    decision: 'direct',
    severity: 'success',
    message: 'Analysis: source looks directly playable. Starting stream.',
    currentFormat: mediaType,
    supportedFormats: SUPPORTED_FORMATS,
  };
};

import type { PlaybackAnalysisResult } from '../types';
import { detectMediaType, detectMediaTypeFromContentType } from '../utils/mediaType';

const SUPPORTED_FORMATS: PlaybackAnalysisResult['supportedFormats'] = ['hls', 'dash', 'mp4', 'mkv'];

type SourceResolutionPayload = {
  provider?: 'direct' | 'terabox' | 'pixeldrain';
  status?: 'none' | 'resolved' | 'auth_required';
  label?: string;
};

const normalizeAudioCodec = (audioCodec?: string): string => (audioCodec ?? '').trim().toLowerCase();

const getAudioCodecLabel = (audioCodec?: string): string => {
  const normalized = normalizeAudioCodec(audioCodec);

  if (normalized === 'aac') {
    return 'AAC 2.0';
  }

  if (normalized === 'eac3' || normalized === 'ec-3') {
    return 'EAC3/EC-3 (Dolby Digital Plus 5.1)';
  }

  if (normalized === 'ac3' || normalized === 'ac-3') {
    return 'AC-3 (Dolby Digital 5.1)';
  }

  return audioCodec?.trim() || 'Unknown';
};

const isSupportedAudioCodec = (audioCodec?: string): boolean => normalizeAudioCodec(audioCodec) === 'aac';

const getAudioCompatibilityMessage = (audioCodec?: string): string => {
  if (isSupportedAudioCodec(audioCodec) || !audioCodec) {
    return '';
  }

  return `Detected audio codec ${getAudioCodecLabel(audioCodec)} is not supported in this player. Only AAC 2.0 audio is supported for reliable playback.`;
};

const getAudioSupportNotice = (audioCodec?: string): string => {
  if (!audioCodec || isSupportedAudioCodec(audioCodec)) {
    return 'AAC 2.0 is supported.';
  }

  return `Unsupported codec: ${getAudioCodecLabel(audioCodec)}. Supported codec: AAC 2.0.`;
};

const deriveSourceStatus = (sourceResolution?: SourceResolutionPayload): Pick<PlaybackAnalysisResult, 'sourceStatusLabel' | 'sourceStatusTone'> => {
  if (!sourceResolution || sourceResolution.status === 'none') {
    return {
      sourceStatusLabel: '',
      sourceStatusTone: 'info',
    };
  }

  if (sourceResolution.label) {
    return {
      sourceStatusLabel: sourceResolution.label,
      sourceStatusTone: sourceResolution.status === 'resolved' ? 'success' : 'warning',
    };
  }

  if (sourceResolution.provider === 'terabox' && sourceResolution.status === 'resolved') {
    return {
      sourceStatusLabel: 'TeraBox link resolved',
      sourceStatusTone: 'success',
    };
  }

  if (sourceResolution.provider === 'terabox' && sourceResolution.status === 'auth_required') {
    return {
      sourceStatusLabel: 'TeraBox requires authenticated browser session',
      sourceStatusTone: 'warning',
    };
  }

  if (sourceResolution.provider === 'pixeldrain' && sourceResolution.status === 'resolved') {
    return {
      sourceStatusLabel: 'Pixeldrain link resolved',
      sourceStatusTone: 'success',
    };
  }

  if (sourceResolution.provider === 'pixeldrain' && sourceResolution.status === 'auth_required') {
    return {
      sourceStatusLabel: 'Pixeldrain requires authenticated browser session',
      sourceStatusTone: 'warning',
    };
  }

  return {
    sourceStatusLabel: '',
    sourceStatusTone: 'info',
  };
};

const isHttpUrl = (value: string): boolean => /^https?:\/\//i.test(value);

const buildAbsolutePlayableUrl = (playableUrl: string): string => {
  if (isHttpUrl(playableUrl)) {
    return playableUrl;
  }

  return playableUrl.startsWith('/') ? playableUrl : `/api/stream?url=${encodeURIComponent(playableUrl)}`;
};

const withPlaybackTypeHint = (playbackUrl: string, currentFormat: PlaybackAnalysisResult['currentFormat']): string => {
  if (currentFormat === 'unknown' || !playbackUrl.startsWith('/api/stream')) {
    return playbackUrl;
  }

  const separator = playbackUrl.includes('?') ? '&' : '?';
  return `${playbackUrl}${separator}pf_type=${encodeURIComponent(currentFormat)}`;
};

const tryBackendAnalyze = async (url: string): Promise<PlaybackAnalysisResult | null> => {
  const response = await fetch('/api/analyze', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ url }),
  });

  const payload = (await response.json()) as {
    success?: boolean;
    strategy?: 'direct' | 'proxy' | 'transcode' | 'error';
    playableUrl?: string;
    metadata?: {
      type?: PlaybackAnalysisResult['currentFormat'];
      contentType?: string;
      audioCodec?: string;
    };
    sourceResolution?: SourceResolutionPayload;
    error?: string;
  };

  const sourceStatus = deriveSourceStatus(payload.sourceResolution);

  if (!response.ok) {
    const metadataType = payload.metadata?.type;
    const typeFromContent = detectMediaTypeFromContentType(payload.metadata?.contentType ?? '');
    const audioSupportNotice = getAudioSupportNotice(payload.metadata?.audioCodec);
    const currentFormat = metadataType && metadataType !== 'unknown'
      ? metadataType
      : (typeFromContent !== 'unknown' ? typeFromContent : detectMediaType(url));

    return {
      shouldProceed: false,
      playbackUrl: url,
      decision: 'error',
      severity: 'error',
      message: payload.error || 'Analyze failed. Unable to determine safe playback strategy.',
      audioSupportNotice,
      sourceStatusLabel: sourceStatus.sourceStatusLabel,
      sourceStatusTone: sourceStatus.sourceStatusTone,
      currentFormat,
      supportedFormats: SUPPORTED_FORMATS,
    };
  }

  if (!payload) {
    return null;
  }

  const metadataType = payload.metadata?.type;
  const typeFromContent = detectMediaTypeFromContentType(payload.metadata?.contentType ?? '');
  const audioCompatibilityMessage = getAudioCompatibilityMessage(payload.metadata?.audioCodec);
  const audioSupportNotice = getAudioSupportNotice(payload.metadata?.audioCodec);
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
      audioSupportNotice,
      sourceStatusLabel: sourceStatus.sourceStatusLabel,
      sourceStatusTone: sourceStatus.sourceStatusTone,
      currentFormat,
      supportedFormats: SUPPORTED_FORMATS,
    };
  }

  const playbackUrl = withPlaybackTypeHint(
    buildAbsolutePlayableUrl(payload.playableUrl || url),
    currentFormat,
  );

  if (payload.strategy === 'direct') {
    return {
      shouldProceed: true,
      playbackUrl,
      decision: 'direct',
      severity: audioCompatibilityMessage ? 'warning' : 'success',
      message: audioCompatibilityMessage || 'Analysis complete: direct playback selected.',
      audioSupportNotice,
      sourceStatusLabel: sourceStatus.sourceStatusLabel,
      sourceStatusTone: sourceStatus.sourceStatusTone,
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
      message: audioCompatibilityMessage || 'Analysis complete: proxy playback selected due to network/CORS constraints.',
      audioSupportNotice,
      sourceStatusLabel: sourceStatus.sourceStatusLabel,
      sourceStatusTone: sourceStatus.sourceStatusTone,
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
      message: audioCompatibilityMessage || 'Analysis complete: transcoding path selected for codec compatibility.',
      audioSupportNotice,
      sourceStatusLabel: sourceStatus.sourceStatusLabel,
      sourceStatusTone: sourceStatus.sourceStatusTone,
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
    audioSupportNotice,
    sourceStatusLabel: sourceStatus.sourceStatusLabel,
    sourceStatusTone: sourceStatus.sourceStatusTone,
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
      audioSupportNotice: 'AAC 2.0 is supported.',
      sourceStatusLabel: '',
      sourceStatusTone: 'info',
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
      audioSupportNotice: 'AAC 2.0 is supported.',
      sourceStatusLabel: '',
      sourceStatusTone: 'info',
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
      audioSupportNotice: 'AAC 2.0 is supported.',
      sourceStatusLabel: '',
      sourceStatusTone: 'info',
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
      audioSupportNotice: 'AAC 2.0 is supported.',
      sourceStatusLabel: '',
      sourceStatusTone: 'info',
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
      audioSupportNotice: 'AAC 2.0 is supported.',
      sourceStatusLabel: '',
      sourceStatusTone: 'info',
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
    audioSupportNotice: 'AAC 2.0 is supported.',
    sourceStatusLabel: '',
    sourceStatusTone: 'info',
    currentFormat: mediaType,
    supportedFormats: SUPPORTED_FORMATS,
  };
};

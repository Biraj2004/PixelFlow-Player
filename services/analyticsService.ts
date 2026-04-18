import type { PlayerAnalyticsSnapshot, PlayerDiagnostics, Strategy } from '../components/types';
import { detectMediaType } from '../utils/mediaType';
import { redactUrl } from '@/lib/security';

export const createDiagnostics = (url: string): PlayerDiagnostics => {
  const host = typeof window !== 'undefined' ? window.location.hostname : '';
  const redactedUrl = redactUrl(url);

  return {
    url: redactedUrl,
    mediaType: detectMediaType(url),
    corsLikelyRequired: host ? !url.includes(host) : true,
    timestamp: Date.now(),
  };
};

export const buildAnalyticsSnapshot = (args: {
  diagnostics: PlayerDiagnostics | null;
  strategy: Strategy | null;
  retries: number;
  videoElement: HTMLVideoElement | null;
}): PlayerAnalyticsSnapshot => {
  const { diagnostics, strategy, retries, videoElement } = args;
  const bufferedSeconds = videoElement?.buffered.length
    ? Number((videoElement.buffered.end(videoElement.buffered.length - 1) - videoElement.currentTime).toFixed(2))
    : 0;

  return {
    diagnostics,
    currentStrategy: strategy,
    retries,
    latencyMs: Math.max(0, Math.round((videoElement?.currentTime ?? 0) * 10)),
    estimatedBandwidthKbps: Math.round(
      ((videoElement as HTMLVideoElement & { webkitVideoDecodedByteCount?: number } | null)
        ?.webkitVideoDecodedByteCount ?? 0) / 1024,
    ),
    bufferedSeconds,
    capturedAt: Date.now(),
  };
};

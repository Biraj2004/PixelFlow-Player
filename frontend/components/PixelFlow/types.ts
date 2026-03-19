export type PlayerStatus =
  | 'idle'
  | 'loading'
  | 'buffering'
  | 'switching'
  | 'playing'
  | 'error';

export type Strategy = 'native' | 'hls' | 'dash';

export type LogLevel = 'info' | 'success' | 'warning' | 'error';

export interface StreamOption {
  name: string;
  url: string;
}

export interface PlayerControllerCallbacks {
  onStateChange?: (status: PlayerStatus) => void;
  onError?: (error: Error) => void;
  onRetry?: (count: number) => void;
  onStrategyChange?: (strategy: Strategy) => void;
}

export interface PlaybackAdapter {
  attach: (videoElement: HTMLVideoElement) => void;
  load: (url: string) => Promise<void>;
  destroy: () => void;
}

export interface PlayerLog {
  msg: string;
  type: LogLevel;
  time: string;
}

export interface SelectableTrack {
  id: string;
  label: string;
  language?: string;
  enabled: boolean;
}

export interface PlayerDiagnostics {
  url: string;
  mediaType: 'mp4' | 'mkv' | 'hls' | 'dash' | 'unknown';
  corsLikelyRequired: boolean;
  timestamp: number;
}

export interface PlayerAnalyticsSnapshot {
  diagnostics: PlayerDiagnostics | null;
  currentStrategy: Strategy | null;
  retries: number;
  latencyMs: number;
  estimatedBandwidthKbps: number;
  bufferedSeconds: number;
  capturedAt: number;
}

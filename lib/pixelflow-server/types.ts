export type MediaType = 'hls' | 'dash' | 'mp4' | 'mkv' | 'unknown';

export type DecisionStrategy = 'direct' | 'proxy' | 'transcode' | 'error';

export interface StreamMetadata {
  type: MediaType;
  videoCodec: 'h264' | 'hevc';
  audioCodec: 'aac' | 'eac3';
  duration: number | null;
  hasAudio: boolean;
  hasSubtitles: boolean;
  contentType: string;
}

export interface AnalyzeSuccess {
  success: true;
  playableUrl: string;
  strategy: DecisionStrategy;
  metadata: StreamMetadata;
}

export interface AnalyzeFailure {
  success: false;
  error: string;
}

export type AnalyzeResponse = AnalyzeSuccess | AnalyzeFailure;

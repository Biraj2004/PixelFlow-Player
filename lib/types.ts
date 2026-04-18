export type MediaType = 'hls' | 'dash' | 'mp4' | 'mkv' | 'unknown';

export type DecisionStrategy = 'direct' | 'proxy' | 'transcode' | 'error';

export type SourceProvider = 'direct' | 'terabox' | 'pixeldrain';

export type SourceResolutionStatus = 'none' | 'resolved' | 'auth_required';

export interface SourceResolution {
  provider: SourceProvider;
  status: SourceResolutionStatus;
  label?: string;
}

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
  sourceResolution: SourceResolution;
}

export interface AnalyzeFailure {
  success: false;
  error: string;
  sourceResolution?: SourceResolution;
}

export type AnalyzeResponse = AnalyzeSuccess | AnalyzeFailure;

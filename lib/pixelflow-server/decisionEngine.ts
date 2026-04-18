import type { DecisionStrategy, StreamMetadata } from './types';

export const pickStrategy = (args: { metadata: StreamMetadata; forceProxy?: boolean }): DecisionStrategy => {
  const { metadata, forceProxy = false } = args;

  if (forceProxy) {
    return 'proxy';
  }

  if (metadata.videoCodec === 'hevc' || metadata.audioCodec === 'eac3' || metadata.type === 'mkv') {
    return 'transcode';
  }

  if (metadata.type === 'unknown') {
    return 'proxy';
  }

  return 'direct';
};

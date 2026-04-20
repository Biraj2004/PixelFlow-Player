import type { SelectableTrack } from '../components/types';

const readNativeAudioTracks = (videoElement: HTMLVideoElement): SelectableTrack[] => {
  const nativeTracks = (videoElement as HTMLVideoElement & {
    audioTracks?: ArrayLike<{ id?: string; label?: string; language?: string; enabled?: boolean }>;
  }).audioTracks;

  if (!nativeTracks || nativeTracks.length === 0) {
    return [];
  }

  return Array.from(nativeTracks).map((track, index) => ({
    id: track.id ?? String(index),
    label: track.label || `Audio ${index + 1}`,
    language: track.language,
    enabled: Boolean(track.enabled),
  }));
};

const hasAudiblePrimaryTrack = (videoElement: HTMLVideoElement): boolean => {
  const media = videoElement as HTMLVideoElement & {
    mozHasAudio?: boolean;
    webkitAudioDecodedByteCount?: number;
    captureStream?: () => MediaStream;
  };

  if (media.mozHasAudio === true) {
    return true;
  }

  if (typeof media.webkitAudioDecodedByteCount === 'number' && media.webkitAudioDecodedByteCount > 0) {
    return true;
  }

  if (typeof media.captureStream === 'function') {
    try {
      const stream = media.captureStream();
      if (stream.getAudioTracks().length > 0) {
        return true;
      }
    } catch {
      // Ignore capture failures and continue with conservative fallback.
    }
  }

  return false;
};

export const getAudioTracks = (videoElement: HTMLVideoElement): SelectableTrack[] => {
  const nativeTracks = readNativeAudioTracks(videoElement);
  if (nativeTracks.length > 0) {
    return nativeTracks;
  }

  if (hasAudiblePrimaryTrack(videoElement)) {
    return [{
      id: 'primary',
      label: 'Primary Audio',
      language: 'und',
      enabled: true,
    }];
  }

  return [];
};

export const selectAudioTrack = (videoElement: HTMLVideoElement, id: string): void => {
  const nativeTracks = (videoElement as HTMLVideoElement & {
    audioTracks?: ArrayLike<{ id?: string; enabled?: boolean }>;
  }).audioTracks;

  if (!nativeTracks) {
    return;
  }

  Array.from(nativeTracks).forEach((track, index) => {
    track.enabled = (track.id ?? String(index)) === id;
  });
};

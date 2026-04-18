import type { SelectableTrack } from '../types';

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

export const getAudioTracks = (videoElement: HTMLVideoElement): SelectableTrack[] => {
  return readNativeAudioTracks(videoElement);
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

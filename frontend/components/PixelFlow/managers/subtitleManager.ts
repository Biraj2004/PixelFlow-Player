import type { SelectableTrack } from '../types';

export const getSubtitleTracks = (videoElement: HTMLVideoElement): SelectableTrack[] => {
  const tracks = Array.from(videoElement.textTracks ?? []);

  return tracks.map((track, index) => ({
    id: String(index),
    label: track.label || `Subtitle ${index + 1}`,
    language: track.language,
    enabled: track.mode === 'showing',
  }));
};

export const selectSubtitleTrack = (videoElement: HTMLVideoElement, id: string): void => {
  const tracks = Array.from(videoElement.textTracks ?? []);

  tracks.forEach((track, index) => {
    track.mode = String(index) === id ? 'showing' : 'disabled';
  });
};

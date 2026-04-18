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

export const attachExternalSubtitleTrack = (videoElement: HTMLVideoElement, subtitleUrl: string): void => {
  if (!subtitleUrl.trim()) {
    return;
  }

  const existing = videoElement.querySelector(`track[data-pixelflow-external="true"][src="${subtitleUrl}"]`);
  if (existing) {
    return;
  }

  const track = document.createElement('track');
  track.kind = 'subtitles';
  track.label = 'External Subtitle';
  track.srclang = 'en';
  track.src = subtitleUrl;
  track.default = true;
  track.setAttribute('data-pixelflow-external', 'true');
  videoElement.appendChild(track);
};

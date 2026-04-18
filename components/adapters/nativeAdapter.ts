import type { PlaybackAdapter, SelectableTrack } from '../types';

export class NativeAdapter implements PlaybackAdapter {
  private videoElement: HTMLVideoElement | null = null;
  private onTracksChanged: (() => void) | null = null;

  attach = (videoElement: HTMLVideoElement): void => {
    this.videoElement = videoElement;
  };

  setOnTracksChanged = (callback: () => void): void => {
    this.onTracksChanged = callback;
  };

  getAudioTracks = (): SelectableTrack[] => {
    const nativeTracks = (this.videoElement as HTMLVideoElement & {
      audioTracks?: ArrayLike<{ id?: string; label?: string; language?: string; enabled?: boolean }>;
    } | null)?.audioTracks;

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

  getSubtitleTracks = (): SelectableTrack[] => {
    const tracks = Array.from(this.videoElement?.textTracks ?? []);

    return tracks.map((track, index) => ({
      id: String(index),
      label: track.label || `Subtitle ${index + 1}`,
      language: track.language,
      enabled: track.mode === 'showing',
    }));
  };

  selectAudioTrack = (id: string): void => {
    const nativeTracks = (this.videoElement as HTMLVideoElement & {
      audioTracks?: ArrayLike<{ id?: string; enabled?: boolean }>;
    } | null)?.audioTracks;

    if (!nativeTracks) {
      return;
    }

    Array.from(nativeTracks).forEach((track, index) => {
      track.enabled = (track.id ?? String(index)) === id;
    });

    this.onTracksChanged?.();
  };

  selectSubtitleTrack = (id: string): void => {
    const tracks = Array.from(this.videoElement?.textTracks ?? []);

    tracks.forEach((track, index) => {
      track.mode = String(index) === id ? 'showing' : 'disabled';
    });

    this.onTracksChanged?.();
  };

  load = async (url: string): Promise<void> => {
    if (!this.videoElement) {
      throw new Error('Video element not attached');
    }

    const video = this.videoElement;

    await new Promise<void>((resolve, reject) => {
      const onReady = (): void => {
        cleanup();
        this.onTracksChanged?.();
        resolve();
      };

      const onError = (): void => {
        cleanup();
        const mediaError = video.error;
        reject(new Error(mediaError ? `Native playback error code ${mediaError.code}` : 'Native playback failed to load media'));
      };

      const cleanup = (): void => {
        video.removeEventListener('loadedmetadata', onReady);
        video.removeEventListener('canplay', onReady);
        video.removeEventListener('error', onError);
        window.clearTimeout(timeoutId);
      };

      const timeoutId = window.setTimeout(() => {
        cleanup();
        reject(new Error('Timed out waiting for media metadata'));
      }, 10_000);

      video.addEventListener('loadedmetadata', onReady);
      video.addEventListener('canplay', onReady);
      video.addEventListener('error', onError);

      video.src = url;
      video.load();
    });
  };

  destroy = (): void => {
    if (!this.videoElement) {
      return;
    }

    this.videoElement.pause();
    this.videoElement.removeAttribute('src');
    this.videoElement.load();
  };
}

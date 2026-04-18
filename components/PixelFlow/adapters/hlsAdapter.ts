import Hls, { type ErrorData } from 'hls.js';
import type { PlaybackAdapter, SelectableTrack } from '../types';

export class HlsAdapter implements PlaybackAdapter {
  private hls: Hls | null = null;
  private videoElement: HTMLVideoElement | null = null;
  private onTracksChanged: (() => void) | null = null;

  static isSupported = (): boolean => Hls.isSupported();

  attach = (videoElement: HTMLVideoElement): void => {
    this.videoElement = videoElement;
  };

  setOnTracksChanged = (callback: () => void): void => {
    this.onTracksChanged = callback;
  };

  getAudioTracks = (): SelectableTrack[] => {
    if (!this.hls || this.hls.audioTracks.length === 0) {
      return [];
    }

    return this.hls.audioTracks.map((track, index) => ({
      id: String(index),
      label: track.name || `Audio ${index + 1}`,
      language: track.lang || undefined,
      enabled: this.hls?.audioTrack === index,
    }));
  };

  getSubtitleTracks = (): SelectableTrack[] => {
    if (!this.hls || this.hls.subtitleTracks.length === 0) {
      return [];
    }

    return this.hls.subtitleTracks.map((track, index) => ({
      id: String(index),
      label: track.name || `Subtitle ${index + 1}`,
      language: track.lang || undefined,
      enabled: this.hls?.subtitleTrack === index,
    }));
  };

  selectAudioTrack = (id: string): void => {
    if (!this.hls) {
      return;
    }

    const index = Number(id);
    if (!Number.isNaN(index)) {
      this.hls.audioTrack = index;
      this.onTracksChanged?.();
    }
  };

  selectSubtitleTrack = (id: string): void => {
    if (!this.hls) {
      return;
    }

    const index = Number(id);
    if (!Number.isNaN(index)) {
      this.hls.subtitleTrack = index;
      this.onTracksChanged?.();
    }
  };

  load = async (url: string): Promise<void> => {
    if (!this.videoElement) {
      throw new Error('Video element not attached');
    }

    if (this.hls) {
      this.destroy();
    }

    this.hls = new Hls({
      enableWorker: true,
      lowLatencyMode: true,
      backBufferLength: 90,
    });

    await new Promise<void>((resolve, reject) => {
      if (!this.hls || !this.videoElement) {
        reject(new Error('HLS initialization failed'));
        return;
      }

      const onManifestParsed = (): void => {
        this.onTracksChanged?.();
        cleanup();
        resolve();
      };

      const onTracksUpdated = (): void => {
        this.onTracksChanged?.();
      };

      const onError = (_event: string, data: ErrorData): void => {
        if (!this.hls) {
          cleanup();
          reject(new Error('HLS instance not available'));
          return;
        }

        if (!data.fatal) {
          return;
        }

        switch (data.type) {
          case Hls.ErrorTypes.NETWORK_ERROR:
            console.error('[HlsAdapter] fatal network error, trying startLoad recovery');
            this.hls.startLoad();
            break;
          case Hls.ErrorTypes.MEDIA_ERROR:
            console.error('[HlsAdapter] fatal media error, trying recoverMediaError');
            this.hls.recoverMediaError();
            break;
          default:
            cleanup();
            reject(new Error(`HLS fatal error: ${data.details}`));
            break;
        }
      };

      const cleanup = (): void => {
        if (!this.hls) {
          return;
        }
        this.hls.off(Hls.Events.MANIFEST_PARSED, onManifestParsed);
        this.hls.off(Hls.Events.ERROR, onError);
        this.hls.off(Hls.Events.AUDIO_TRACKS_UPDATED, onTracksUpdated);
        this.hls.off(Hls.Events.AUDIO_TRACK_SWITCHED, onTracksUpdated);
        this.hls.off(Hls.Events.SUBTITLE_TRACKS_UPDATED, onTracksUpdated);
        this.hls.off(Hls.Events.SUBTITLE_TRACK_SWITCH, onTracksUpdated);
      };

      this.hls.on(Hls.Events.MANIFEST_PARSED, onManifestParsed);
      this.hls.on(Hls.Events.ERROR, onError);
      this.hls.on(Hls.Events.AUDIO_TRACKS_UPDATED, onTracksUpdated);
      this.hls.on(Hls.Events.AUDIO_TRACK_SWITCHED, onTracksUpdated);
      this.hls.on(Hls.Events.SUBTITLE_TRACKS_UPDATED, onTracksUpdated);
      this.hls.on(Hls.Events.SUBTITLE_TRACK_SWITCH, onTracksUpdated);
      this.hls.loadSource(url);
      this.hls.attachMedia(this.videoElement);
    });
  };

  destroy = (): void => {
    if (!this.hls) {
      return;
    }

    this.hls.destroy();
    this.hls = null;
  };
}

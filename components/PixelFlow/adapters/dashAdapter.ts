import type { PlaybackAdapter, SelectableTrack } from '../types';

type DashLikePlayer = {
  initialize: (element: HTMLMediaElement, source: string, autoPlay: boolean) => void;
  on: (event: string, handler: (payload: unknown) => void) => void;
  off: (event: string, handler: (payload: unknown) => void) => void;
  getTracksFor?: (type: 'audio' | 'text') => Array<{ lang?: string; labels?: Array<{ text?: string }>; id?: string | number; index?: number }>;
  getCurrentTrackFor?: (type: 'audio' | 'text') => { id?: string | number; index?: number } | null;
  setCurrentTrack?: (track: unknown) => void;
  reset: () => void;
};

export class DashAdapter implements PlaybackAdapter {
  private player: DashLikePlayer | null = null;
  private videoElement: HTMLVideoElement | null = null;
  private onTracksChanged: (() => void) | null = null;

  static isSupported = (): boolean => {
    return typeof window !== 'undefined' && typeof window.MediaSource !== 'undefined';
  };

  attach = (videoElement: HTMLVideoElement): void => {
    this.videoElement = videoElement;
  };

  setOnTracksChanged = (callback: () => void): void => {
    this.onTracksChanged = callback;
  };

  private mapDashTracks = (type: 'audio' | 'text'): SelectableTrack[] => {
    if (!this.player?.getTracksFor) {
      return [];
    }

    const tracks = this.player.getTracksFor(type) ?? [];
    const active = this.player.getCurrentTrackFor?.(type);

    return tracks.map((track, index) => {
      const candidateId = track.id ?? track.index ?? index;
      const id = String(candidateId);
      const label = track.labels?.[0]?.text || `${type === 'audio' ? 'Audio' : 'Subtitle'} ${index + 1}`;
      const activeId = String(active?.id ?? active?.index ?? '');

      return {
        id,
        label,
        language: track.lang || undefined,
        enabled: activeId === id,
      };
    });
  };

  getAudioTracks = (): SelectableTrack[] => this.mapDashTracks('audio');

  getSubtitleTracks = (): SelectableTrack[] => this.mapDashTracks('text');

  selectAudioTrack = (id: string): void => {
    if (!this.player?.getTracksFor || !this.player?.setCurrentTrack) {
      return;
    }

    const tracks = this.player.getTracksFor('audio') ?? [];
    const selected = tracks.find((track, index) => String(track.id ?? track.index ?? index) === id);
    if (selected) {
      this.player.setCurrentTrack(selected);
      this.onTracksChanged?.();
    }
  };

  selectSubtitleTrack = (id: string): void => {
    if (!this.player?.getTracksFor || !this.player?.setCurrentTrack) {
      return;
    }

    const tracks = this.player.getTracksFor('text') ?? [];
    const selected = tracks.find((track, index) => String(track.id ?? track.index ?? index) === id);
    if (selected) {
      this.player.setCurrentTrack(selected);
      this.onTracksChanged?.();
    }
  };

  load = async (url: string): Promise<void> => {
    if (!this.videoElement) {
      throw new Error('Video element not attached');
    }
    const videoElement = this.videoElement;

    if (this.player) {
      this.destroy();
    }

    await new Promise<void>((resolve, reject) => {
      try {
        void import('dashjs').then((dashjsModule) => {
          const dashjs = dashjsModule.MediaPlayer;
          const events = dashjs.events;
          this.player = dashjs().create() as unknown as DashLikePlayer;

          if (!this.player) {
            reject(new Error('Failed to initialize DASH player'));
            return;
          }

          const onInitialized = (): void => {
            this.onTracksChanged?.();
            cleanup();
            resolve();
          };

          const onTracksUpdated = (): void => {
            this.onTracksChanged?.();
          };

          const onError = (event: unknown): void => {
            cleanup();
            reject(new Error(`DASH error: ${JSON.stringify(event)}`));
          };

          const cleanup = (): void => {
            if (!this.player) {
              return;
            }
            this.player.off(events.STREAM_INITIALIZED, onInitialized);
            this.player.off(events.ERROR, onError);
            this.player.off(events.TEXT_TRACKS_ADDED, onTracksUpdated);
            this.player.off(events.TRACK_CHANGE_RENDERED, onTracksUpdated);
          };

          this.player.on(events.STREAM_INITIALIZED, onInitialized);
          this.player.on(events.ERROR, onError);
          this.player.on(events.TEXT_TRACKS_ADDED, onTracksUpdated);
          this.player.on(events.TRACK_CHANGE_RENDERED, onTracksUpdated);
          this.player.initialize(videoElement, url, false);
        }).catch((error) => {
          reject(error instanceof Error ? error : new Error('Failed to import dash.js'));
        });
      } catch (error) {
        reject(error instanceof Error ? error : new Error('Unknown DASH error'));
      }
    });
  };

  destroy = (): void => {
    if (!this.player) {
      return;
    }

    this.player.reset();
    this.player = null;
  };
}

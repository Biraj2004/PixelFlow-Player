import type { StreamOption } from '../components/types';

export class PlaylistManager {
  private playlist: StreamOption[];
  private index = 0;

  constructor(initialPlaylist: StreamOption[]) {
    this.playlist = initialPlaylist;
  }

  getAll = (): StreamOption[] => this.playlist;

  getCurrent = (): StreamOption | null => this.playlist[this.index] ?? null;

  setCurrentByUrl = (url: string): StreamOption | null => {
    const nextIndex = this.playlist.findIndex((item) => item.url === url);
    if (nextIndex < 0) {
      return null;
    }

    this.index = nextIndex;
    return this.getCurrent();
  };

  next = (): StreamOption | null => {
    if (this.playlist.length === 0) {
      return null;
    }

    this.index = (this.index + 1) % this.playlist.length;
    return this.getCurrent();
  };

  previous = (): StreamOption | null => {
    if (this.playlist.length === 0) {
      return null;
    }

    this.index = (this.index - 1 + this.playlist.length) % this.playlist.length;
    return this.getCurrent();
  };
}

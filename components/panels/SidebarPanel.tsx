import clsx from 'clsx';
import type { AnalysisDecision, AnalysisSeverity, PlayerDiagnostics, SelectableTrack, StreamOption } from '../types';
import type { MediaType } from '../../utils/mediaType';

type SidebarPanelProps = {
  playlist: StreamOption[];
  url: string;
  diagnostics: PlayerDiagnostics | null;
  audioTracks: SelectableTrack[];
  subtitleTracks: SelectableTrack[];
  showPlaylist: boolean;
  currentFormat: MediaType;
  analysisDecision: AnalysisDecision;
  analysisSeverity: AnalysisSeverity;
  analysisMessage: string;
  onChooseStream: (stream: StreamOption) => Promise<void>;
  onChooseAudio: (id: string) => void;
  onChooseSubtitle: (id: string) => void;
};

const TrackList = ({
  title,
  tracks,
  empty,
  helper,
  onChoose,
}: {
  title: string;
  tracks: SelectableTrack[];
  empty: string;
  helper?: string;
  onChoose: (id: string) => void;
}) => (
  <div className="bg-surface-low rounded-lg p-4 border border-white/5 space-y-3">
    <h3 className="text-xs font-display font-bold text-gray-500 uppercase tracking-widest">{title}</h3>
    <p className="text-[11px] text-gray-500">Available: {tracks.length > 0 ? `yes (${tracks.length})` : 'no'}</p>
    {helper ? <p className="text-[11px] text-gray-500">{helper}</p> : null}
    {tracks.length === 0 ? (
      <p className="text-xs text-gray-500">{empty}</p>
    ) : (
      <div className="space-y-2">
        {tracks.map((track) => (
          <button
            key={track.id}
            onClick={() => onChoose(track.id)}
            className={clsx(
              'w-full text-left px-3 py-2 text-xs rounded border transition-colors',
              track.enabled ? 'border-primary/40 text-primary bg-primary/10' : 'border-white/10 text-gray-300 hover:border-primary/20',
            )}
          >
            <div className="flex items-center justify-between gap-2">
              <span className="truncate">{track.label}</span>
              <span className="text-[10px] uppercase tracking-wide text-gray-400">{track.language || 'unknown'}</span>
            </div>
          </button>
        ))}
      </div>
    )}
  </div>
);

const SidebarPanel = ({
  playlist,
  url,
  diagnostics,
  audioTracks,
  subtitleTracks,
  showPlaylist,
  currentFormat,
  analysisDecision,
  analysisSeverity,
  analysisMessage,
  onChooseStream,
  onChooseAudio,
  onChooseSubtitle,
}: SidebarPanelProps) => {
  const mediaType = diagnostics?.mediaType === 'unknown' ? currentFormat : diagnostics?.mediaType || currentFormat;
  const corsRisk = diagnostics ? (diagnostics.corsLikelyRequired ? 'high' : 'low') : 'unknown';
  const hasPrimaryAudioOnly = audioTracks.length === 1 && audioTracks[0]?.id === 'primary';

  return (
    <div className="space-y-4">
      {showPlaylist && (
        <div className="bg-surface-low rounded-lg p-4 border border-white/5">
          <h3 className="text-xs font-display font-bold text-gray-500 uppercase tracking-widest mb-4">Playlist</h3>
          <div className={clsx('space-y-2 pr-1', playlist.length > 5 ? 'max-h-56 overflow-y-auto' : '')}>
            {playlist.map((stream) => (
              <button
                key={stream.url}
                onClick={() => {
                  void onChooseStream(stream);
                }}
                className={clsx(
                  'w-full text-left px-3 py-2 text-xs font-medium rounded transition-all border truncate',
                  url === stream.url
                    ? 'text-primary border-primary/30 bg-primary/10'
                    : 'text-gray-300 hover:text-primary hover:bg-surface-container border-transparent hover:border-primary/20',
                )}
              >
                {stream.name}
              </button>
            ))}
          </div>
        </div>
      )}

      <TrackList
        title="Audio Tracks"
        tracks={audioTracks}
        helper={hasPrimaryAudioOnly ? 'Primary embedded audio detected. No alternate audio tracks are exposed by this source.' : undefined}
        empty="No audio tracks detected from this source metadata."
        onChoose={onChooseAudio}
      />
      <TrackList
        title="Subtitle Tracks"
        tracks={subtitleTracks}
        helper={subtitleTracks.length === 0 ? 'No subtitle tracks are exposed by this source. Add an external .vtt or .srt URL above if needed.' : undefined}
        empty="No subtitle tracks detected."
        onChoose={onChooseSubtitle}
      />

      <div className="bg-surface-container rounded-lg border border-white/5 p-4 space-y-2">
        <h3 className="text-xs font-display font-bold text-gray-500 uppercase tracking-widest">Playback Details</h3>
        <div className="text-xs text-gray-300">Type: {mediaType || 'unknown'}</div>
        <div className="text-xs text-gray-300">CORS Risk: {corsRisk}</div>
        <div className="text-xs text-gray-300">Decision: {analysisDecision}</div>
        <div
          className={clsx(
            'text-xs break-words',
            analysisSeverity === 'success'
              ? 'text-primary'
              : analysisSeverity === 'warning'
                ? 'text-yellow-300'
                : analysisSeverity === 'error'
                  ? 'text-tertiary'
                  : 'text-gray-400',
          )}
        >
          {analysisMessage || 'No analysis message available.'}
        </div>
      </div>
    </div>
  );
};

export default SidebarPanel;

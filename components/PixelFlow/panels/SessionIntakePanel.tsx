import type { IntakeState } from '../utils/playlistInput';
import type { MediaType } from '../utils/mediaType';

type SessionIntakePanelProps = {
  intake: IntakeState;
  currentFormat: MediaType;
  supportedFormats: MediaType[];
  onChange: (field: keyof IntakeState, value: string) => void;
  onApply: () => void;
  canApply: boolean;
};

const SessionIntakePanel = ({ intake, currentFormat, supportedFormats, onChange, onApply, canApply }: SessionIntakePanelProps) => {
  return (
    <section className="rounded-xl border border-white/10 bg-surface-low p-5 md:p-6 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-display text-lg tracking-wide text-foreground">Session Intake</h2>
        <span className="rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-primary">
          Current format: {currentFormat}
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <span className="text-[11px] uppercase tracking-[0.16em] text-gray-400">Supported formats:</span>
        {supportedFormats.map((format) => (
          <span key={format} className="rounded border border-white/15 bg-surface-container px-2 py-1 text-[11px] uppercase tracking-wider text-gray-300">
            {format}
          </span>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <label className="space-y-1 md:col-span-2">
          <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-gray-400">Video/Playlist URL(s) + Optional Subtitle URL</span>
          <input
            value={intake.sourceInput}
            onChange={(event) => onChange('sourceInput', event.target.value)}
            placeholder="Paste link here..."
            className="w-full rounded-lg border border-white/15 bg-surface-container px-3 py-2 text-sm text-gray-200 outline-none placeholder:text-gray-300 focus:border-primary"
          />
          <p className="text-[11px] text-gray-500">Supports single URL, comma/newline separated URLs. Add one .vtt or .srt URL in the same box to auto-attach external subtitles.</p>
        </label>
      </div>

      <button
        type="button"
        onClick={onApply}
        disabled={!canApply}
        className="rounded bg-gradient-to-br from-primary to-primary-container px-5 py-2 text-sm font-bold tracking-wide text-black disabled:cursor-not-allowed disabled:opacity-50"
      >
        Apply Session
      </button>
    </section>
  );
};

export default SessionIntakePanel;

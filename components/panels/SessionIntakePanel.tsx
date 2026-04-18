import type { IntakeState } from '../utils/playlistInput';
import type { MediaType } from '../utils/mediaType';
import type { AnalysisSeverity } from '../types';

type SessionIntakePanelProps = {
  intake: IntakeState;
  currentFormat: MediaType;
  supportedFormats: MediaType[];
  sourceStatusLabel: string;
  sourceStatusTone: AnalysisSeverity;
  audioSupportNotice: string;
  onChange: (field: keyof IntakeState, value: string) => void;
  onApply: () => void;
  onClear: () => void;
  canApply: boolean;
  canClear: boolean;
};

const statusToneClasses: Record<AnalysisSeverity, string> = {
  success: 'border-emerald-400/30 bg-emerald-400/10 text-emerald-200',
  info: 'border-sky-400/30 bg-sky-400/10 text-sky-200',
  warning: 'border-amber-400/30 bg-amber-400/10 text-amber-200',
  error: 'border-rose-400/30 bg-rose-400/10 text-rose-200',
};

const UNSUPPORTED_AUDIO_CODECS_LABEL = 'Not supported: EAC3/EC-3 (Dolby Digital Plus 5.1), AC-3 (Dolby Digital 5.1).';

const SessionIntakePanel = ({
  intake,
  currentFormat,
  supportedFormats,
  sourceStatusLabel,
  sourceStatusTone,
  audioSupportNotice,
  onChange,
  onApply,
  onClear,
  canApply,
  canClear,
}: SessionIntakePanelProps) => {
  const audioSupportClass = /unsupported/i.test(audioSupportNotice)
    ? 'border-amber-400/30 bg-amber-400/10 text-amber-200'
    : 'border-emerald-400/30 bg-emerald-400/10 text-emerald-200';

  return (
    <section className="rounded-xl border border-white/10 bg-surface-low p-5 md:p-6 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-display text-lg tracking-wide text-foreground">Session Intake</h2>
        <span className="rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-primary">
          Current format: {currentFormat}
        </span>
      </div>

      {sourceStatusLabel ? (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[11px] uppercase tracking-[0.16em] text-gray-400">Source status:</span>
          <span className={`rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-wider ${statusToneClasses[sourceStatusTone]}`}>
            {sourceStatusLabel}
          </span>
        </div>
      ) : null}

      <div className="flex flex-wrap items-center gap-2">
        <span className="text-[11px] uppercase tracking-[0.16em] text-gray-400">Audio support:</span>
        <span className={`rounded-full border px-3 py-1 text-[11px] font-semibold tracking-wide ${audioSupportClass}`}>
          {audioSupportNotice || 'AAC 2.0 is supported.'}
        </span>
      </div>
      <p className="text-[11px] text-gray-400">{UNSUPPORTED_AUDIO_CODECS_LABEL}</p>

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
          <textarea
            value={intake.sourceInput}
            onChange={(event) => onChange('sourceInput', event.target.value)}
            placeholder="Paste link here..."
            rows={3}
            className="w-full rounded-lg border border-white/15 bg-surface-container px-3 py-2 text-sm text-gray-200 outline-none placeholder:text-gray-300 focus:border-primary focus-visible:ring-2 focus-visible:ring-primary/70 focus-visible:ring-offset-2 focus-visible:ring-offset-surface-low resize-y"
          />
          <p className="text-[11px] text-gray-500">Supports single URL, comma/newline separated URLs. Add one .vtt or .srt URL in the same box to auto-attach external subtitles.</p>
        </label>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={onApply}
          disabled={!canApply}
          className="rounded bg-gradient-to-br from-primary to-primary-container px-5 py-2 text-sm font-bold tracking-wide text-black focus-visible:ring-2 focus-visible:ring-primary/80 focus-visible:ring-offset-2 focus-visible:ring-offset-surface-low disabled:cursor-not-allowed disabled:opacity-50"
        >
          Apply Session
        </button>

        <button
          type="button"
          onClick={onClear}
          disabled={!canClear}
          className="rounded border border-white/20 bg-transparent px-4 py-2 text-sm font-semibold tracking-wide text-gray-200 transition-colors hover:border-primary/40 hover:text-primary focus-visible:ring-2 focus-visible:ring-primary/80 focus-visible:ring-offset-2 focus-visible:ring-offset-surface-low disabled:cursor-not-allowed disabled:opacity-40"
        >
          Clear Link
        </button>
      </div>
    </section>
  );
};

export default SessionIntakePanel;

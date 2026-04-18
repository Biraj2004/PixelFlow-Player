import { BRANDING } from '@/branding/branding';

type PixelFlowLogoProps = {
  size?: number;
  className?: string;
  showWordmark?: boolean;
};

const PixelFlowLogo = ({ size = 40, className = '', showWordmark = true }: PixelFlowLogoProps) => {
  return (
    <div className={`pf-brand-lockup ${className}`.trim()}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 48 48"
        fill="none"
        role="img"
        aria-label={`${BRANDING.name} logo`}
      >
        <rect x="4" y="4" width="40" height="40" rx="12" fill={BRANDING.logo.dark} stroke={BRANDING.logo.primary} strokeOpacity="0.4" />
        <path d="M12 18h24l-8 8h-9l5 4H12v-4l5-4-5-4z" fill={BRANDING.logo.primary} />
        <circle cx="35" cy="14" r="3" fill={BRANDING.logo.accent} className="pf-brand-pulse" />
      </svg>

      {showWordmark ? (
        <div className="pf-brand-text">
          <span className="pf-brand-name">{BRANDING.name}</span>
          <span className="pf-brand-label">{BRANDING.productLabel}</span>
        </div>
      ) : null}
    </div>
  );
};

export default PixelFlowLogo;

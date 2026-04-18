import SmartPlayer from '../components/PixelFlow/SmartPlayer';
import PixelFlowLogo from '@/components/Branding/PixelFlowLogo';
import { getBrandEyebrow, getBrandHeadline, getPlatformPill, BRANDING } from '@/lib/branding/branding';

const Home = () => {
  return (
    <main className="pf-page px-4 py-8 md:px-8">
      <section className="mx-auto mb-6 w-full max-w-7xl">
        <div className="pf-hero-panel">
          <div className="pf-hero-glow" aria-hidden="true" />

          <div className="relative z-10 max-w-4xl space-y-4">
            <PixelFlowLogo size={46} />
            <p className="pf-eyebrow text-primary">{getBrandEyebrow()}</p>
            <h1 className="font-display text-[clamp(1.9rem,4vw,3rem)] font-bold leading-[1.06] tracking-[-0.01em] text-foreground">
              {getBrandHeadline()}
            </h1>
            <p className="text-sm leading-relaxed text-gray-300 md:text-[15px]">
              {BRANDING.description}
            </p>

            <div className="flex flex-wrap items-center gap-2 pt-1">
              <span className="pf-provider-pill pf-provider-pill-cyan">{getPlatformPill('terabox')}</span>
              <span className="pf-provider-pill pf-provider-pill-pink">{getPlatformPill('pixeldrain')}</span>
            </div>
          </div>
        </div>
      </section>

      <SmartPlayer />
    </main>
  );
};

export default Home;

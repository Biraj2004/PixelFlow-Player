import SmartPlayer from '../components/PixelFlow/SmartPlayer';
import PixelFlowLogo from '@/components/Branding/PixelFlowLogo';
import { getBrandEyebrow, getBrandHeadline, getPlatformPill, getPrimaryCtaLabel, BRANDING } from '@/lib/branding/branding';

const Home = () => {
  return (
    <main className="pf-page px-4 py-8 md:px-8">
      <section className="mx-auto mb-6 w-full max-w-7xl">
        <div className="pf-hero-panel">
          <div className="pf-hero-glow" aria-hidden="true" />

          <div className="relative z-10 grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_220px] lg:items-center">
            <div className="max-w-4xl space-y-4">
              <PixelFlowLogo size={46} />
              <p className="pf-eyebrow text-primary">{getBrandEyebrow()}</p>
              <h1 className="font-display text-[clamp(1.9rem,4vw,3rem)] font-bold leading-[1.06] tracking-[-0.01em] text-foreground">
                {getBrandHeadline()}
              </h1>
              <p className="text-sm leading-relaxed text-gray-300 md:text-[15px]">
                {BRANDING.description}
              </p>

              <div className="flex flex-wrap items-center gap-2 pt-1">
                <a href="#link-play" className="pf-provider-pill no-underline">
                  {getPrimaryCtaLabel()}
                </a>
                <span className="pf-provider-pill pf-provider-pill-cyan">{getPlatformPill('terabox')}</span>
                <span className="pf-provider-pill pf-provider-pill-pink">{getPlatformPill('pixeldrain')}</span>
              </div>
            </div>

            <div className="pf-hero-micro" aria-hidden="true">
              <span className="pf-hero-orbit pf-hero-orbit-a" />
              <span className="pf-hero-orbit pf-hero-orbit-b" />
              <span className="pf-hero-dot" />
              <span className="pf-hero-beam" />
            </div>
          </div>
        </div>
      </section>

      <section id="link-play">
        <SmartPlayer />
      </section>
    </main>
  );
};

export default Home;

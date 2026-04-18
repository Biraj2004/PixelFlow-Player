import SmartPlayer from '../components/SmartPlayer';
import PixelFlowLogo from '@/branding/PixelFlowLogo';
import { getBrandEyebrow, getBrandHeadline, getPlatformPill, getPrimaryCtaLabel, getProjectCtaLabel, BRANDING } from '@/branding/branding';

const Home = () => {
  return (
    <main className="pf-page px-4 py-8 md:px-8">
      <section className="mx-auto mb-6 w-full max-w-7xl">
        <div className="pf-hero-panel">
          <div className="pf-hero-glow" aria-hidden="true" />

          <div className="relative z-10 grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_220px] lg:items-center">
            <div className="max-w-4xl space-y-4">
              <div className="pf-hero-top">
                <PixelFlowLogo size={46} showWordmark={false} />
                <a
                  href={BRANDING.projectUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="pf-provider-pill pf-project-link no-underline flex items-center gap-2"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" aria-hidden="true" fill="currentColor">
                    <path d="M12 2C6.48 2 2 6.59 2 12.25c0 4.53 2.87 8.37 6.84 9.73.5.1.68-.22.68-.49 0-.24-.01-1.05-.01-1.9-2.78.62-3.37-1.21-3.37-1.21-.45-1.2-1.1-1.52-1.1-1.52-.9-.63.07-.62.07-.62 1 .07 1.52 1.05 1.52 1.05.88 1.56 2.31 1.11 2.88.85.09-.66.35-1.11.63-1.36-2.22-.26-4.55-1.14-4.55-5.08 0-1.12.39-2.03 1.03-2.75-.1-.26-.45-1.31.1-2.73 0 0 .84-.27 2.75 1.05A9.3 9.3 0 0 1 12 6.91c.85 0 1.71.12 2.51.36 1.9-1.32 2.74-1.05 2.74-1.05.56 1.42.21 2.47.11 2.73.64.72 1.03 1.63 1.03 2.75 0 3.95-2.33 4.82-4.56 5.07.36.31.68.92.68 1.86 0 1.34-.01 2.42-.01 2.75 0 .27.18.6.69.49A10.27 10.27 0 0 0 22 12.25C22 6.59 17.52 2 12 2Z" />
                  </svg>
                  <span>{getProjectCtaLabel()}</span>
                </a>
              </div>
              <p className="pf-eyebrow pf-hero-eyebrow text-primary">{getBrandEyebrow()}</p>
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
              <span className="pf-hero-globe" />
              <span className="pf-hero-contours" />
              <span className="pf-hero-meridian pf-hero-meridian-a" />
              <span className="pf-hero-meridian pf-hero-meridian-b" />
              <span className="pf-hero-latitude pf-hero-latitude-a" />
              <span className="pf-hero-latitude pf-hero-latitude-b" />
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

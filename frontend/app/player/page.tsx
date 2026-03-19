import Link from 'next/link';
import SmartPlayer from '../../components/PixelFlow/SmartPlayer';

const PlayerPage = () => {
  return (
    <main className="min-h-screen px-4 py-8 md:px-8">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between pb-4">
        <h1 className="font-display text-lg tracking-[0.2em] text-primary uppercase">PixelFlow Player</h1>
        <Link href="/" className="text-sm text-gray-300 underline decoration-primary/40 underline-offset-4 hover:text-primary">
          Back to Landing
        </Link>
      </div>
      <SmartPlayer />
    </main>
  );
};

export default PlayerPage;

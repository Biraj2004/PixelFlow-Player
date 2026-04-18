import SmartPlayer from '../components/PixelFlow/SmartPlayer';

const Home = () => {
  return (
    <main className="pf-page px-4 py-8 md:px-8">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between pb-4">
        <h1 className="pf-section-title text-primary">PixelFlow Player</h1>
      </div>
      <SmartPlayer />
    </main>
  );
};

export default Home;

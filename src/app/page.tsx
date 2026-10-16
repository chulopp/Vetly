import Hero from '@/components/home/Hero';
import EntryCard from '@/components/home/EntryCard';

export default function HomePage() {
  return (
    <main className="mx-auto w-full max-w-5xl px-4 pb-24">
      <Hero />
      <EntryCard />
    </main>
  );
}

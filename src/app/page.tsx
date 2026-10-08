import { RESORTS } from '@/data/resorts';

export default function Home() {
  return (
    <main className="grid min-h-dvh place-items-center p-8">
      <p className="text-muted-foreground">{RESORTS.length} resorts loaded.</p>
    </main>
  );
}

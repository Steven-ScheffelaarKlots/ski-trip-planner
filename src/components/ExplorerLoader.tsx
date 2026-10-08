'use client';

import dynamic from 'next/dynamic';

const ResortExplorer = dynamic(() => import('@/components/ResortExplorer'), {
  ssr: false,
  loading: () => <div className="grid h-dvh place-items-center text-sm text-muted-foreground">Loading map…</div>,
});

export default function ExplorerLoader() {
  return <ResortExplorer />;
}

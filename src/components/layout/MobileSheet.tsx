'use client';

import { Drawer } from 'vaul';

export type SnapPoint = string | number;

/** Peek (header + a card), half screen, near-full. */
export const SNAP_POINTS: SnapPoint[] = ['148px', 0.5, 0.92];

type Props = {
  title: string;
  activeSnap: SnapPoint;
  onActiveSnapChange: (snap: SnapPoint) => void;
  children: React.ReactNode;
};

/** Always-open, non-modal sheet: the map stays interactive above it. */
export function MobileSheet({ title, activeSnap, onActiveSnapChange, children }: Props) {
  return (
    <Drawer.Root
      open
      modal={false}
      dismissible={false}
      snapPoints={SNAP_POINTS}
      activeSnapPoint={activeSnap}
      setActiveSnapPoint={(s) => onActiveSnapChange(s ?? SNAP_POINTS[0])}
    >
      <Drawer.Portal>
        <Drawer.Content
          aria-describedby={undefined}
          className="fixed inset-x-0 bottom-0 z-20 flex h-full max-h-[97dvh] flex-col rounded-t-2xl border-t bg-background shadow-[0_-4px_16px_rgba(0,0,0,0.12)] outline-none"
        >
          <div className="mx-auto mt-2 h-1.5 w-10 shrink-0 rounded-full bg-muted-foreground/30" />
          <Drawer.Title className="px-4 py-2 text-sm font-semibold">{title}</Drawer.Title>
          <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-8">{children}</div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}

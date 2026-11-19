'use client';

import { useSyncExternalStore } from 'react';

function subscribeToNothing(): () => void {
  return () => undefined;
}

export function TaskDate({ iso }: { iso: string }) {
  // false while rendering on the server and during hydration, true afterwards: the server
  // HTML and the first client render show the same UTC text, then the browser's local
  // time replaces it, with no hydration mismatch (DECISIONS D-14, D-27).
  const isHydrated = useSyncExternalStore(
    subscribeToNothing,
    () => true,
    () => false,
  );
  const text = isHydrated
    ? new Intl.DateTimeFormat(undefined, {
        dateStyle: 'medium',
        timeStyle: 'short',
      }).format(new Date(iso))
    : `${iso.slice(0, 10)} ${iso.slice(11, 16)} UTC`;

  return <time dateTime={iso}>{text}</time>;
}

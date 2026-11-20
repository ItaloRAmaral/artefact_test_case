'use client';

import { useSyncExternalStore } from 'react';

function subscribeToNothing(): () => void {
  return () => undefined;
}

/**
 * Renders a task's creation date.
 *
 * @param props.iso - The date as an ISO 8601 string.
 * @returns A `time` element.
 */
export function TaskDate({ iso }: { iso: string }) {
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

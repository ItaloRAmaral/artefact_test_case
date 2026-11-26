import { useSyncExternalStore } from 'react';

function subscribeToNothing(): () => void {
  return () => undefined;
}

/**
 * Tells whether the component renders in the browser after hydration.
 *
 * @returns `false` on the server and during hydration, `true` afterwards.
 */
export function useIsHydrated(): boolean {
  return useSyncExternalStore(
    subscribeToNothing,
    () => true,
    () => false,
  );
}

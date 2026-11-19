'use client';

import { useEffect, useState } from 'react';

const TOAST_DURATION_MS = 4000;

export function Toast({
  kind,
  text,
}: {
  kind: 'success' | 'error';
  text: string;
}) {
  const [isVisible, setIsVisible] = useState(true);

  // Runs once per mount: the caller gives each result a new key, so a new result remounts
  // the toast and restarts the timer, even with the same text.
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setIsVisible(false);
    }, TOAST_DURATION_MS);

    return () => {
      clearTimeout(timeoutId);
    };
  }, []);

  if (!isVisible) {
    return null;
  }

  return (
    <p
      role={kind === 'success' ? 'status' : 'alert'}
      style={{ position: 'fixed', right: '1rem', bottom: '1rem' }}
    >
      {text}
    </p>
  );
}

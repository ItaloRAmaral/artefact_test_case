'use client';

import type { ReactNode } from 'react';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';

import type { ShowToast, ToastMessage } from './dto';

const TOAST_DURATION_MS = 4000;

const ShowToastContext = createContext<ShowToast | null>(null);

// Lives in the root layout, which stays mounted across navigations, so a page can show a
// result on the page it navigates to (DECISIONS D-29).
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<ToastMessage | null>(null);
  const showToast = useCallback<ShowToast>((kind, text) => {
    setToast((current) => ({ id: (current?.id ?? 0) + 1, kind, text }));
  }, []);

  return (
    <ShowToastContext value={showToast}>
      {children}
      <ToastRegion toast={toast} />
    </ShowToastContext>
  );
}

export function useShowToast(): ShowToast {
  const showToast = useContext(ShowToastContext);

  if (showToast === null) {
    throw new Error('useShowToast must be used inside ToastProvider');
  }

  return showToast;
}

// Both live regions stay on the page, empty until a result: screen readers announce a
// change inside an existing region, but often miss a region inserted with its text.
function ToastRegion({ toast }: { toast: ToastMessage | null }) {
  return (
    <div style={{ position: 'fixed', right: '1rem', bottom: '1rem' }}>
      <div role="status">
        {toast?.kind === 'success' ? (
          <ToastText key={toast.id} text={toast.text} />
        ) : null}
      </div>
      <div role="alert">
        {toast?.kind === 'error' ? (
          <ToastText key={toast.id} text={toast.text} />
        ) : null}
      </div>
    </div>
  );
}

function ToastText({ text }: { text: string }) {
  const [isVisible, setIsVisible] = useState(true);

  // Runs once per mount: each result has a new key, so a new result remounts the text and
  // restarts the timer, even with the same text.
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
      style={{
        margin: 0,
        padding: '0.5rem 1rem',
        border: '1px solid',
        background: 'Canvas',
        color: 'CanvasText',
      }}
    >
      {text}
    </p>
  );
}

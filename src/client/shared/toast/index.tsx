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
    <div className="fixed right-4 bottom-4 z-50 flex max-w-sm flex-col gap-2">
      <div role="status">
        {toast?.kind === 'success' ? (
          <ToastText key={toast.id} kind="success" text={toast.text} />
        ) : null}
      </div>
      <div role="alert">
        {toast?.kind === 'error' ? (
          <ToastText key={toast.id} kind="error" text={toast.text} />
        ) : null}
      </div>
    </div>
  );
}

function ToastText({ kind, text }: Pick<ToastMessage, 'kind' | 'text'>) {
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
      className={`rounded-md border-l-4 bg-white px-4 py-3 text-sm shadow-lg dark:bg-zinc-900 ${
        kind === 'success'
          ? 'border-emerald-500 text-emerald-800 dark:text-emerald-300'
          : 'border-red-500 text-red-700 dark:text-red-400'
      }`}
    >
      {text}
    </p>
  );
}

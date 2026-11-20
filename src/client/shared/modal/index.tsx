'use client';

import { useRouter } from 'next/navigation';
import type { ReactNode } from 'react';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useRef,
} from 'react';

import type { CloseModal } from './dto';

const CloseModalContext = createContext<CloseModal | null>(null);

export function useCloseModal(): CloseModal | null {
  return useContext(CloseModalContext);
}

// The modal is a route (DECISIONS D-35): closing it is going back in history, which
// restores the list's URL and its filters. It goes back once per opening: a double click,
// or Close then Escape, must not leave the list too. Escape is caught in `cancel`, and
// there is no `close` handler, so the dialog closing on unmount never navigates.
export function Modal({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  const router = useRouter();
  const titleId = useId();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const afterCloseRef = useRef<(() => void) | null>(null);
  const isOpenRef = useRef(false);
  const isGoingBackRef = useRef(false);
  const goBack = useCallback(() => {
    if (isGoingBackRef.current) {
      return;
    }

    isGoingBackRef.current = true;
    router.back();
  }, [router]);
  const closeModal = useCallback<CloseModal>(
    (afterClose) => {
      // A save can finish after the user has closed the modal: the list is already back.
      if (!isOpenRef.current) {
        afterClose();

        return;
      }

      afterCloseRef.current = afterClose;
      goBack();
    },
    [goBack],
  );

  useEffect(() => {
    const dialog = dialogRef.current;

    if (dialog === null) {
      return;
    }

    dialog.showModal();
    isOpenRef.current = true;
    isGoingBackRef.current = false;
    // showModal focuses the first control (Close); the form's first field is where the
    // user starts. React's autoFocus cannot do it: the dialog is still closed then.
    dialog.querySelector<HTMLElement>('input, textarea, select')?.focus();

    // The page behind a modal dialog is inert, so feedback for it (a toast) waits until
    // the dialog has closed.
    return () => {
      isOpenRef.current = false;
      dialog.close();
      afterCloseRef.current?.();
      afterCloseRef.current = null;
    };
  }, []);

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      className="card m-auto w-[min(42rem,calc(100%-2rem))] p-0 text-inherit shadow-xl backdrop:bg-zinc-950/50"
      onCancel={(event) => {
        event.preventDefault();
        goBack();
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          goBack();
        }
      }}
    >
      <div className="p-6">
        <div className="mb-4 flex items-center justify-between gap-4">
          <h2 id={titleId} className="page-title">
            {title}
          </h2>
          <button
            type="button"
            className="button button-secondary"
            onClick={goBack}
          >
            Close
          </button>
        </div>
        <CloseModalContext value={closeModal}>{children}</CloseModalContext>
      </div>
    </dialog>
  );
}

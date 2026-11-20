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
import { CloseIcon } from '@/client/shared/icons';

const CloseModalContext = createContext<CloseModal | null>(null);

/**
 * Gets the function that closes the modal around the caller.
 *
 * @returns The close function, or `null` outside a modal.
 */
export function useCloseModal(): CloseModal | null {
  return useContext(CloseModalContext);
}

/**
 * Renders its content in a modal dialog that closes by going back in history.
 *
 * @param props.title - The dialog title.
 * @param props.children - The dialog content.
 * @returns The dialog.
 */
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
    dialog.querySelector<HTMLElement>('input, textarea, select')?.focus();

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
      className="card m-auto w-[min(42rem,calc(100%-2rem))] p-0 text-inherit shadow-2xl backdrop:bg-slate-950/50 backdrop:backdrop-blur-sm"
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
          <h2 id={titleId} className="text-2xl font-semibold tracking-tight">
            {title}
          </h2>
          <button
            type="button"
            className="icon-button -mr-2"
            aria-label="Close"
            title="Close"
            onClick={goBack}
          >
            <CloseIcon className="size-5" />
          </button>
        </div>
        <CloseModalContext value={closeModal}>{children}</CloseModalContext>
      </div>
    </dialog>
  );
}

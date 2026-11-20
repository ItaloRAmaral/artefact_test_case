import type { ReactNode } from 'react';

// Inline SVG icons: a handful of strokes, so no icon library (DECISIONS D-33, D-37). They
// are decoration, hidden from screen readers: the control around each one carries the name.
function StrokeIcon({
  className,
  children,
}: {
  className: string | undefined;
  children: ReactNode;
}) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className ?? 'size-4'}
    >
      {children}
    </svg>
  );
}

export function PlusIcon({ className }: { className?: string }) {
  return (
    <StrokeIcon className={className}>
      <path d="M12 5v14M5 12h14" />
    </StrokeIcon>
  );
}

export function SearchIcon({ className }: { className?: string }) {
  return (
    <StrokeIcon className={className}>
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </StrokeIcon>
  );
}

export function PencilIcon({ className }: { className?: string }) {
  return (
    <StrokeIcon className={className}>
      <path d="M4 20h4L18.5 9.5a2.1 2.1 0 0 0-4-4L4 16v4Z" />
      <path d="m13.5 6.5 4 4" />
    </StrokeIcon>
  );
}

export function TrashIcon({ className }: { className?: string }) {
  return (
    <StrokeIcon className={className}>
      <path d="M4 7h16M10 11v6M14 11v6" />
      <path d="M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12" />
      <path d="M9 7V4h6v3" />
    </StrokeIcon>
  );
}

export function CloseIcon({ className }: { className?: string }) {
  return (
    <StrokeIcon className={className}>
      <path d="M6 6l12 12M18 6 6 18" />
    </StrokeIcon>
  );
}

export function CalendarIcon({ className }: { className?: string }) {
  return (
    <StrokeIcon className={className}>
      <rect x="4" y="5" width="16" height="15" rx="2" />
      <path d="M4 10h16M9 3v4M15 3v4" />
    </StrokeIcon>
  );
}

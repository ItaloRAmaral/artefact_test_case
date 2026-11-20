import '@testing-library/jest-dom/vitest';

import { notifyManager } from '@tanstack/react-query';
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

import { installDialogFake } from './dialog';
import { FakeIntersectionObserver } from './intersection-observer';

// TanStack Query tells React about cache changes in a setTimeout by default, which lands
// after act() returns; as a microtask the update happens inside act, so a test can assert
// what the screen shows right after a cache change.
notifyManager.setScheduler(queueMicrotask);

// jsdom has no IntersectionObserver; tests decide when the list's end is on screen.
globalThis.IntersectionObserver = FakeIntersectionObserver;

installDialogFake();

afterEach(() => {
  cleanup();
});

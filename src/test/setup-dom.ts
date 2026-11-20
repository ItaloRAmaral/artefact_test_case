import '@testing-library/jest-dom/vitest';

import { notifyManager } from '@tanstack/react-query';
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

import { installDialogFake } from './dialog';
import { FakeIntersectionObserver } from './intersection-observer';

notifyManager.setScheduler(queueMicrotask);

globalThis.IntersectionObserver = FakeIntersectionObserver;

installDialogFake();

afterEach(() => {
  cleanup();
});

import { act } from '@testing-library/react';

export class FakeIntersectionObserver implements IntersectionObserver {
  private static readonly live = new Set<FakeIntersectionObserver>();

  readonly root: Element | Document | null = null;

  readonly rootMargin: string;

  readonly scrollMargin = '0px';

  readonly thresholds: readonly number[] = [0];

  private readonly targets = new Set<Element>();

  constructor(
    private readonly callback: IntersectionObserverCallback,
    options: IntersectionObserverInit = {},
  ) {
    this.rootMargin = options.rootMargin ?? '0px';
  }

  static revealAll(): void {
    act(() => {
      for (const observer of [...FakeIntersectionObserver.live]) {
        observer.reveal();
      }
    });
  }

  observe(target: Element): void {
    this.targets.add(target);
    FakeIntersectionObserver.live.add(this);
  }

  unobserve(target: Element): void {
    this.targets.delete(target);
  }

  disconnect(): void {
    this.targets.clear();
    FakeIntersectionObserver.live.delete(this);
  }

  takeRecords(): IntersectionObserverEntry[] {
    return [];
  }

  private reveal(): void {
    const entries = [...this.targets].map(
      (target) =>
        ({ isIntersecting: true, target }) as IntersectionObserverEntry,
    );

    this.callback(entries, this);
  }
}

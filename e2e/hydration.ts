import type { Page } from '@playwright/test';
import { expect } from '@playwright/test';

/**
 * Opens a page and waits until React has hydrated the list.
 *
 * @param page - The Playwright page.
 * @param url - The URL to open.
 */
export async function gotoHydrated(page: Page, url: string): Promise<void> {
  await page.goto(url);
  await expect(page.getByRole('time').first()).not.toContainText('UTC');
}

import type { Page } from '@playwright/test';
import { expect } from '@playwright/test';

// Until React hydrates the list, a click on a link is a plain page load (the full form
// page, not the modal) and a typed filter is lost. A task's date switches from UTC to
// local time only after hydration (DECISIONS D-14), so it shows when the page is ready.
export async function gotoHydrated(page: Page, url: string): Promise<void> {
  await page.goto(url);
  await expect(page.getByRole('time').first()).not.toContainText('UTC');
}

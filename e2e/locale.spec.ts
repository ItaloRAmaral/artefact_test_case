import { expect, test } from '@playwright/test';

import { gotoHydrated } from './hydration';
import { createTask } from './api';

test.use({ locale: 'pt-BR' });

test('shows the calendar and the dates in English in a Portuguese browser', async ({
  page,
  request,
}) => {
  const title = `Locale ${String(Date.now())}`;
  await createTask(request, { title });
  await gotoHydrated(page, `/?titleContains=${encodeURIComponent(title)}`);

  await page.getByRole('button', { name: /^Created from/ }).click();

  await expect(page.getByRole('listitem').locator('time')).toHaveText(
    /^[A-Z][a-z]{2} \d{1,2}, \d{4}/,
  );
  await expect(page.getByRole('grid')).toHaveAccessibleName(
    /^[A-Z][a-z]+ \d{4}$/,
  );
});

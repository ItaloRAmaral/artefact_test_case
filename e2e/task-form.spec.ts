import { expect, test } from '@playwright/test';

test('creates a task and sees it in the list', async ({ page }) => {
  const title = `Form task ${String(Date.now())}`;
  await page.goto('/');
  await page.getByRole('link', { name: 'New task' }).click();
  await page.getByLabel('Title', { exact: true }).fill(title);

  await page.getByRole('button', { name: 'Save' }).click();

  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByRole('status')).toHaveText('Task created.');
  await expect(page.getByRole('heading', { name: title })).toBeVisible();
});

test('opens a fresh form for a second task', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('link', { name: 'New task' }).click();
  await page
    .getByLabel('Title', { exact: true })
    .fill(`Form task ${String(Date.now())}`);
  await page.getByRole('button', { name: 'Save' }).click();
  await expect(page).toHaveURL(/\/$/);

  await page.getByRole('link', { name: 'New task' }).click();

  await expect(page.getByLabel('Title', { exact: true })).toHaveValue('');
  await expect(page.getByRole('button', { name: 'Save' })).toBeEnabled();
});

test('edits a task and sees the change in the list', async ({
  page,
  request,
}) => {
  const title = `Edit task ${String(Date.now())}`;
  const newTitle = `${title} edited`;
  await request.post('/api/trpc/task.create', { data: { title } });
  await page.goto('/');
  await page.getByRole('link', { name: `Edit ${title}` }).click();
  await page.getByRole('textbox', { name: 'Title' }).fill(newTitle);

  await page.getByRole('button', { name: 'Save' }).click();

  await expect(page.getByRole('status')).toHaveText('Task saved.');
  await expect(page.getByRole('heading', { name: newTitle })).toBeVisible();
  await expect(
    page.getByRole('heading', { name: title, exact: true }),
  ).toHaveCount(0);
});

test('opens the edit form with the saved values after saving', async ({
  page,
  request,
}) => {
  const title = `Edit task ${String(Date.now())}`;
  const newTitle = `${title} edited`;
  await request.post('/api/trpc/task.create', { data: { title } });
  await page.goto('/');
  await page.getByRole('link', { name: `Edit ${title}` }).click();
  await page.getByRole('textbox', { name: 'Title' }).fill(newTitle);
  await page.getByRole('button', { name: 'Save' }).click();
  await expect(page).toHaveURL(/\/$/);

  await page.getByRole('link', { name: `Edit ${newTitle}` }).click();

  await expect(page.getByRole('textbox', { name: 'Title' })).toHaveValue(
    newTitle,
  );
  await expect(page.getByRole('button', { name: 'Save' })).toBeEnabled();
});

test('shows a message for a missing task', async ({ page }) => {
  await page.goto('/tasks/missing-task/edit');

  await expect(page.getByText('This task no longer exists.')).toBeVisible();
});

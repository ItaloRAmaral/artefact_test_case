import { createElement } from 'react';
import { renderToString } from 'react-dom/server';
import { expect, it } from 'vitest';

import { TaskDate } from '.';

it('renders the date in UTC on the server', () => {
  const html = renderToString(
    createElement(TaskDate, { iso: '2026-11-19T12:00:00.000Z' }),
  );

  expect(html).toContain('2026-11-19 12:00 UTC');
});

import { render, screen } from '@testing-library/react';
import { expect, it } from 'vitest';

import { TaskDate } from '.';

it("shows the date in the browser's time zone after mount", () => {
  render(<TaskDate iso="2026-11-19T12:00:00.000Z" />);

  const time = screen.getByRole('time');

  expect(time).toHaveTextContent('9:00');
  expect(time).not.toHaveTextContent('UTC');
});

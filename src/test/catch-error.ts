/**
 * Runs `fn` and returns what it throws, so a test keeps its Act on its own line
 * (`const error = catchError(() => act())`) and asserts the error's `code` separately.
 * Throws when `fn` returns normally, so a missing error fails the test.
 */
export function catchError(fn: () => unknown): unknown {
  try {
    fn();
  } catch (error) {
    return error;
  }
  throw new Error('Expected the function to throw, but it returned normally.');
}

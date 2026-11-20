/**
 * Runs a function and catches what it throws.
 *
 * @param fn - The function to run.
 * @returns What it threw, or `undefined`.
 */
export function catchError(fn: () => unknown): unknown {
  try {
    fn();
  } catch (error) {
    return error;
  }

  throw new Error('Expected the function to throw, but it returned normally.');
}

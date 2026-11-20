/**
 * Passes an input that the contract's types forbid.
 *
 * @param input - The input.
 * @returns The same input, typed as `never`.
 */
export function untyped(input: unknown): never {
  return input as never;
}

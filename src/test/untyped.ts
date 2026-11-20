// Router tests send inputs the contract's types forbid (a value outside a union, a missing
// field), as an untyped client could over HTTP; `never` fits any input type, so the input
// reaches the Zod schema unchanged.
export function untyped(input: unknown): never {
  return input as never;
}

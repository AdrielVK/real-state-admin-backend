export interface ICommand<_TResult = void> {
  // Marker interface — type safety only.
  // The property is `unknown` so both `ICommand<User>` and `ICommand<void>` are
  // structurally compatible (TS rejects `void` as a property type in strict mode).
  readonly _resultType?: unknown;
}

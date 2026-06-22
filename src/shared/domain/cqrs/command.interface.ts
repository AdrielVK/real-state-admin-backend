export interface ICommand<TResult = void> {
  // Marker interface — type safety only
  readonly _resultType?: TResult;
}

export interface IQuery<TResult> {
  // Marker interface — type safety only
  readonly _resultType?: TResult;
}

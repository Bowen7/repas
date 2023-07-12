export type CharTestFunc = (_char: string, _input: string) => boolean | number;

export type OkResult<T> = {
  ok: true;
} & T;

export type ErrResult<E> = {
  ok: false;
} & E;

export type Result<T, E> = OkResult<T> | ErrResult<E>;

export type ParserOkResult<T> = OkResult<{
  rest: string;
  value: T;
}>;

export type ErrMessage =
  | {
      kind: string;
      value: string;
    }
  | string;

export type ParserErrResult = ErrResult<{
  rest: string;
  stack: ErrMessage[];
}>;

export type ParserResult<T> = ParserOkResult<T> | ParserErrResult;

export type OkParser<T> = (
  _input: string,
  _message?: ErrMessage
) => ParserOkResult<T>;

export type Parser<T> = (
  _input: string,
  _message?: ErrMessage
) => ParserResult<T>;

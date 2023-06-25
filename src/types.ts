export type CharacterTester = (_char: string, _str: string) => boolean | number;

export type ParserOkResult<T> = {
  ok: true;
  rest: string;
  value: T;
};

export type ErrMessage =
  | {
      kind: string;
      value: string;
      fatal?: boolean;
    }
  | string;

export type ParserErrResult = {
  ok: false;
  fatal: boolean;
  rest: string;
  stack: {
    kind: string;
    value: string;
  }[];
};

export type ParserResult<T> = ParserOkResult<T> | ParserErrResult;

export type OkParser<T> = (
  _input: string,
  _message?: string
) => ParserOkResult<T>;

export type Parser<T> = (_input: string, _message?: string) => ParserResult<T>;

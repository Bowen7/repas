import { Parser, ParserErrResult } from "./types";

export const errRes = (input: string): ParserErrResult => ({
  ok: false,
  fatal: false,
  rest: input,
  stack: [],
});

export const fatal =
  <T>(parser: Parser<T>): Parser<T> =>
  (input: string, message?: string) => {
    const result = parser(input, message);
    if (result.ok) {
      return result;
    }
    return {
      ...result,
      fatal: true,
    };
  };

export const nonFatal =
  <T>(parser: Parser<T>): Parser<T> =>
  (input: string, message?: string) => {
    const result = parser(input, message);
    if (result.ok) {
      return result;
    }
    return {
      ...result,
      fatal: false,
    };
  };

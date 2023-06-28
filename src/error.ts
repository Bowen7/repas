import { Parser, ErrMessage } from "./types";

export const fatal =
  <T>(parser: Parser<T>): Parser<T> =>
  (input: string, message?: ErrMessage) => {
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
  (input: string, message?: ErrMessage) => {
    const result = parser(input, message);
    if (result.ok) {
      return result;
    }
    return {
      ...result,
      fatal: false,
    };
  };

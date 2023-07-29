import { Parser, ParserErrResult } from "./types";

export class RepasError {
  errRes: ParserErrResult;
  constructor(errRes: ParserErrResult) {
    this.errRes = errRes;
  }
}

export const fatal =
  <T>(parser: Parser<T>, message?: string): Parser<T> =>
  (input: string) => {
    const result = parser(input, message);
    if (result.ok) {
      return result;
    }
    throw new RepasError(result);
  };

export const catchFatal =
  <T>(parser: Parser<T>): Parser<T> =>
  (input: string, message?: string) => {
    try {
      const result = parser(input, message);
      return result;
    } catch (error) {
      if (error instanceof RepasError) {
        return error.errRes;
      }
      throw error;
    }
  };

import { Parser, ParserResult, ParserErrResult, ErrMessage } from "./types";
import { fail } from "./utils";

// 2 parsers
export function alt<T1, T2>(
  _parsers: [Parser<T1>, Parser<T2>]
): Parser<T1 | T2>;

// 3 parsers
export function alt<T1, T2, T3>(
  _parsers: [Parser<T1>, Parser<T2>, Parser<T3>]
): Parser<T1 | T2 | T3>;

// 4 parsers
export function alt<T1, T2, T3, T4>(
  _parsers: [Parser<T1>, Parser<T2>, Parser<T3>, Parser<T4>]
): Parser<T1 | T2 | T3 | T4>;

// 5 parsers
export function alt<T1, T2, T3, T4, T5>(
  _parsers: [Parser<T1>, Parser<T2>, Parser<T3>, Parser<T4>, Parser<T5>]
): Parser<T1 | T2 | T3 | T4 | T5>;

// 6 parsers
export function alt<T1, T2, T3, T4, T5, T6>(
  _parsers: [
    Parser<T1>,
    Parser<T2>,
    Parser<T3>,
    Parser<T4>,
    Parser<T5>,
    Parser<T6>
  ]
): Parser<T1 | T2 | T3 | T4 | T5 | T6>;

// more than 6 parsers
export function alt<T extends unknown[]>(_parsers: {
  [K in keyof T]: Parser<T[K]>;
}): Parser<T[number]>;
export function alt<T extends unknown[]>(parsers: {
  [K in keyof T]: Parser<T[K]>;
}): Parser<T[number]> {
  return (input: string, message?: ErrMessage): ParserResult<T[number]> => {
    let errRes: ParserErrResult;
    for (const parser of parsers) {
      const result = parser(input);
      if (result.ok) {
        return {
          ok: true,
          rest: result.rest,
          value: result.value,
        };
      }
      errRes = result;
    }
    return fail(errRes!, message);
  };
}

export const either = <T1, T2>(
  parser1: Parser<T1>,
  parser2: Parser<T2>
): Parser<[T1, T2][number]> => alt<[T1, T2]>([parser1, parser2]);

import { Parser, ParserResult } from "./types";
import { pushErrorStack } from "./utils";

// 4 parsers
export function seq<T1, T2, T3, T4>(
  _parsers: [Parser<T1>, Parser<T2>, Parser<T3>, Parser<T4>],
  _outerMessage?: string
): Parser<[T1, T2, T3, T4]>;

// 5 parsers
export function seq<T1, T2, T3, T4, T5>(
  _parsers: [Parser<T1>, Parser<T2>, Parser<T3>, Parser<T4>, Parser<T5>],
  _outerMessage?: string
): Parser<[T1, T2, T3, T4, T5]>;

// 6 parsers
export function seq<T1, T2, T3, T4, T5, T6>(
  _parsers: [
    Parser<T1>,
    Parser<T2>,
    Parser<T3>,
    Parser<T4>,
    Parser<T5>,
    Parser<T6>
  ],
  _outerMessage?: string
): Parser<[T1, T2, T3, T4, T5, T6]>;

// more then 6 parsers
export function seq<T extends unknown[]>(
  _parsers: { [K in keyof T]: Parser<T[K]> },
  _outerMessage?: string
): Parser<T>;

export function seq<T extends unknown[]>(
  parsers: { [K in keyof T]: Parser<T[K]> },
  outerMessage?: string
): Parser<T> {
  return (input: string, message = outerMessage): ParserResult<T> => {
    let rest = input;
    const value: unknown[] = [];
    for (const parser of parsers) {
      const result = (parser as Parser<unknown>)(rest);
      if (!result.ok) {
        return pushErrorStack(result, message);
      }
      rest = result.rest;
      value.push(result.value);
    }
    return {
      ok: true,
      rest,
      value: value as T,
    };
  };
}

export const pair = <T1, T2>(
  parser1: Parser<T1>,
  parser2: Parser<T2>,
  outerMessage?: string
): Parser<[T1, T2]> => seq<[T1, T2]>([parser1, parser2], outerMessage);

export const triplet = <T1, T2, T3>(
  parser1: Parser<T1>,
  parser2: Parser<T2>,
  parser3: Parser<T3>,
  outerMessage?: string
): Parser<[T1, T2, T3]> =>
  seq<[T1, T2, T3]>([parser1, parser2, parser3], outerMessage);

export const delimited = <T1, T2, T3>(
  parser1: Parser<T1>,
  parser2: Parser<T2>,
  parser3: Parser<T3>,
  outerMessage?: string
) => {
  const parser = seq<[T1, T2, T3]>([parser1, parser2, parser3]);
  return (input: string, message = outerMessage): ParserResult<T2> => {
    const result = parser(input);
    if (!result.ok) {
      return pushErrorStack(result, message);
    }
    return {
      ok: true,
      rest: result.rest,
      value: result.value[1],
    };
  };
};

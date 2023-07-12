import { Parser, ParserResult, ErrMessage } from "./types";
import { fail } from "./utils";
import { map } from "./modifier";

// 2 parsers
export function tuple<T1, T2>(
  _parsers: [Parser<T1>, Parser<T2>]
): Parser<[T1, T2]>;

// 3 parsers
export function tuple<T1, T2, T3>(
  _parsers: [Parser<T1>, Parser<T2>, Parser<T3>]
): Parser<[T1, T2, T3]>;

// 4 parsers
export function tuple<T1, T2, T3, T4>(
  _parsers: [Parser<T1>, Parser<T2>, Parser<T3>, Parser<T4>]
): Parser<[T1, T2, T3, T4]>;

// 5 parsers
export function tuple<T1, T2, T3, T4, T5>(
  _parsers: [Parser<T1>, Parser<T2>, Parser<T3>, Parser<T4>, Parser<T5>]
): Parser<[T1, T2, T3, T4, T5]>;

// 6 parsers
export function tuple<T1, T2, T3, T4, T5, T6>(
  _parsers: [
    Parser<T1>,
    Parser<T2>,
    Parser<T3>,
    Parser<T4>,
    Parser<T5>,
    Parser<T6>
  ]
): Parser<[T1, T2, T3, T4, T5, T6]>;

// more then 6 parsers
export function tuple<T extends unknown[]>(_parsers: {
  [K in keyof T]: Parser<T[K]>;
}): Parser<T>;

export function tuple<T extends unknown[]>(parsers: {
  [K in keyof T]: Parser<T[K]>;
}): Parser<T> {
  return (input: string, message?: ErrMessage): ParserResult<T> => {
    let rest = input;
    const value: unknown[] = [];
    for (const parser of parsers) {
      const result = (parser as Parser<unknown>)(rest);
      if (!result.ok) {
        return fail(result, message);
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
  parser2: Parser<T2>
): Parser<[T1, T2]> => tuple<[T1, T2]>([parser1, parser2]);

export const triplet = <T1, T2, T3>(
  parser1: Parser<T1>,
  parser2: Parser<T2>,
  parser3: Parser<T3>
): Parser<[T1, T2, T3]> => tuple<[T1, T2, T3]>([parser1, parser2, parser3]);

export const delimited = <T1, T2, T3>(
  parser1: Parser<T1>,
  parser2: Parser<T2>,
  parser3: Parser<T3>
) => {
  const parser = tuple<[T1, T2, T3]>([parser1, parser2, parser3]);
  return (input: string, message: ErrMessage): ParserResult<T2> => {
    const result = parser(input);
    if (!result.ok) {
      return fail(result, message);
    }
    return {
      ok: true,
      rest: result.rest,
      value: result.value[1],
    };
  };
};

export const preceded = <T1, T2>(parser1: Parser<T1>, parser2: Parser<T2>) =>
  map(tuple([parser1, parser2]), ([v]) => v);

export const terminated = <T1, T2>(parser1: Parser<T1>, parser2: Parser<T2>) =>
  map(tuple([parser1, parser2]), ([, v]) => v);

export const separatedPair = <T1, T2, T3>(
  parser1: Parser<T1>,
  parser2: Parser<T2>,
  parser3: Parser<T3>
) => map(tuple([parser1, parser2, parser3]), ([v1, _v2, v3]) => [v1, v3]);

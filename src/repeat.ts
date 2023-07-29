import { CharTestFunc, ParserErrResult, ParserResult, Parser } from "./types";
import { fail } from "./utils";

export const repeatParser =
  <T>(parser: Parser<T>, min: number, max: number) =>
  (input: string, message?: string): ParserResult<T[]> => {
    let rest = input;
    let count = 0;
    const value: T[] = [];
    let errRes: ParserErrResult | null = null;
    while (rest.length > 0) {
      const result = parser(rest);
      if (!result.ok) {
        errRes = result;
        break;
      }
      rest = result.rest;
      count++;
      value.push(result.value);
      if (count === max) {
        break;
      }
    }
    if (value.length < min) {
      return fail(errRes!, input, message);
    }
    return {
      ok: true,
      rest,
      value,
    };
  };

export const repeatTestFunc =
  (testFunc: CharTestFunc, min: number, max: number) =>
  (input: string, message?: string): ParserResult<string> => {
    let i = 0;
    let count = 0;
    while (i < input.length) {
      const rest = input.slice(i);
      const char = rest[0];
      const len = Number(testFunc(char, rest));
      if (len === 0) {
        break;
      }
      i += len;
      count++;
      if (count === max) {
        break;
      }
    }
    if (count < min) {
      return fail(input, message);
    }
    return {
      ok: true,
      rest: input.slice(i),
      value: input.slice(0, i),
    };
  };

export function repeat<T>(
  _parser: Parser<T>,
  _min: number,
  _max: number
): Parser<T[]>;
export function repeat(
  _testFunc: CharTestFunc,
  _min: number,
  _max: number
): Parser<string>;
export function repeat<T>(
  parser: Parser<T> | CharTestFunc,
  min = 0,
  max = Infinity
): Parser<T[]> | Parser<string> {
  const result = parser(" ", " ");
  const type = typeof result;
  if (type === "number" || type === "boolean") {
    return repeatTestFunc(parser as CharTestFunc, min, max);
  }
  return repeatParser(parser as Parser<T>, min, max);
}

export function take1<T>(_parser: Parser<T>, _message?: string): Parser<T[]>;
export function take1(_testFunc: CharTestFunc): Parser<string>;
export function take1(parser: Parser<unknown> | CharTestFunc): Parser<unknown> {
  return repeat(parser as CharTestFunc, 1, 1);
}

export function takeX<T>(_parser: Parser<T>, _times: number): Parser<T[]>;
export function takeX(_testFunc: CharTestFunc, _times: number): Parser<string>;
export function takeX(
  parser: Parser<unknown> | CharTestFunc,
  times: number
): Parser<unknown> {
  return repeat(parser as CharTestFunc, times, times);
}

export function more0<T>(
  _parser: Parser<T>
): (_input: string) => ParserResult<T[]>;
export function more0(
  _testFunc: CharTestFunc
): (_input: string) => ParserResult<string>;
export function more0(parser: Parser<unknown> | CharTestFunc): Parser<unknown> {
  return repeat(parser as CharTestFunc, 0, Infinity);
}

export function more1<T>(_parser: Parser<T>, _message?: string): Parser<T[]>;
export function more1(_testFunc: CharTestFunc): Parser<string>;
export function more1(parser: Parser<unknown> | CharTestFunc): Parser<unknown> {
  return repeat(parser as CharTestFunc, 1, Infinity);
}

export function moreX<T>(_parser: Parser<T>, _times: number): Parser<T[]>;
export function moreX(_testFunc: CharTestFunc, _times: number): Parser<string>;
export function moreX(
  parser: Parser<unknown> | CharTestFunc,
  times: number
): Parser<unknown> {
  return repeat(parser as CharTestFunc, times, times);
}

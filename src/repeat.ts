import {
  CharacterTester,
  ParserOkResult,
  ParserErrResult,
  ParserResult,
  Parser,
  ErrMessage,
} from "./types";
import { fail } from "./utils";

export const repeatParser =
  <T>(parser: Parser<T>, min: number, max: number) =>
  (input: string, message?: ErrMessage): ParserResult<T[]> => {
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
      return fail(
        errRes!,
        message || {
          kind: "repeat.parser",
          value: `${min} - ${max}`,
        }
      );
    }
    return {
      ok: true,
      rest,
      value,
    };
  };

export const repeatTester =
  (tester: CharacterTester, min: number, max: number) =>
  (input: string, message?: ErrMessage): ParserResult<string> => {
    let i = 0;
    let count = 0;
    while (i < input.length) {
      const char = input[i];
      const str = input.slice(i);
      const len = Number(tester(char, str));
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
      return fail(
        input,
        message || {
          kind: "repeat.tester",
          value: `${min} - ${max}`,
        }
      );
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
  _tester: CharacterTester,
  _min: number,
  _max: number
): Parser<string>;
export function repeat<T>(
  parser: Parser<T> | CharacterTester,
  min = 0,
  max = Infinity
): Parser<T[]> | Parser<string> {
  const result = parser(" ", " ");
  const type = typeof result;
  if (type === "number" || type === "boolean") {
    return repeatTester(parser as CharacterTester, min, max);
  }
  return repeatParser(parser as Parser<T>, min, max);
}

export function take1<T>(
  _parser: Parser<T>,
  _message?: ErrMessage
): Parser<T[]>;
export function take1(_tester: CharacterTester): Parser<string>;
export function take1(
  parser: Parser<unknown> | CharacterTester
): Parser<unknown> {
  return repeat(parser as CharacterTester, 1, 1);
}

export function takeX<T>(_parser: Parser<T>, _times: number): Parser<T[]>;
export function takeX(_tester: CharacterTester, _times: number): Parser<string>;
export function takeX(
  parser: Parser<unknown> | CharacterTester,
  times: number
): Parser<unknown> {
  return repeat(parser as CharacterTester, times, times);
}

export function more0<T>(
  _parser: Parser<T>
): (_input: string) => ParserOkResult<T[]>;
export function more0(
  _tester: CharacterTester
): (_input: string) => ParserOkResult<string>;
export function more0(
  parser: Parser<unknown> | CharacterTester
): Parser<unknown> {
  return repeat(parser as CharacterTester, 0, Infinity);
}

export function more1<T>(
  _parser: Parser<T>,
  _message?: ErrMessage
): Parser<T[]>;
export function more1(_tester: CharacterTester): Parser<string>;
export function more1(
  parser: Parser<unknown> | CharacterTester
): Parser<unknown> {
  return repeat(parser as CharacterTester, 1, Infinity);
}

export function moreX<T>(_parser: Parser<T>, _times: number): Parser<T[]>;
export function moreX(_tester: CharacterTester, _times: number): Parser<string>;
export function moreX(
  parser: Parser<unknown> | CharacterTester,
  times: number
): Parser<unknown> {
  return repeat(parser as CharacterTester, times, times);
}

import { Parser, OkParser, ParserResult, ErrMessage } from "./types";
import { fail } from "./utils";

export const msg =
  <T>(parser: Parser<T>, message: string) =>
  (input: string) =>
    parser(input, message);

export function map<T, R>(
  _parser: OkParser<T>,
  _mapper: (_value: T) => R
): OkParser<R>;
export function map<T, R>(
  _parser: Parser<T>,
  _mapper: (_value: T) => R
): Parser<R>;
export function map<T, R>(
  parser: Parser<T>,
  mapper: (_value: T) => R
): Parser<R> {
  return (input: string, message?: ErrMessage) => {
    const result = parser(input, message);
    if (!result.ok) {
      return result;
    }
    return {
      ...result,
      value: mapper(result.value),
    };
  };
}

export function mapRes<T, R>(
  parser: Parser<T>,
  mapper: (_value: ParserResult<T>) => ParserResult<R>
): Parser<R> {
  return (input: string, message?: ErrMessage) => {
    const result = parser(input, message);
    return mapper(result);
  };
}

export function count<T>(parser: Parser<T>) {
  return (input: string) => {
    let value = 0;
    let res = parser(input);
    while (res.ok) {
      input = res.rest;
      value++;
      res = parser(input);
    }
    return {
      ok: true,
      rest: input,
      value,
    };
  };
}

export function opt<T, D = string>(
  parser: Parser<T | D>,
  defaultValue = "" as D
) {
  return (input: string): ParserResult<T | D> => {
    const res = parser(input);
    if (!res.ok) {
      return {
        ok: true,
        rest: input,
        value: defaultValue,
      };
    }
    return res;
  };
}

export function peek<T>(parser: Parser<T>) {
  return (input: string): ParserResult<T> => {
    const res = parser(input);
    if (!res.ok) {
      return res;
    }
    return {
      ok: true,
      rest: input,
      value: res.value,
    };
  };
}

export function memo<T1 extends Array<unknown>, T2>(
  func: (..._args: T1) => T2
) {
  let cachedKey: T1[0] | null = null;
  let cachedValue: T2;
  return (...args: T1) => {
    if (args[0] === cachedKey) {
      return cachedValue;
    }
    cachedKey = args[0];
    cachedValue = func(...args);
    return cachedValue;
  };
}

export const value =
  <T, V>(parser: Parser<T>, val: V) =>
  (input: string, message?: ErrMessage): ParserResult<V> => {
    const result = parser(input);
    if (!result.ok) {
      return fail(result, message);
    }
    return {
      ...result,
      value: val,
    };
  };

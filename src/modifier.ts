import { Parser, OkParser, ParserResult, ErrMessage } from "./types";
import { fail } from "./utils";

export const msg =
  <T>(parser: Parser<T>, message: string) =>
  (input: string) =>
    parser(input, message);

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

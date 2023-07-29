import { RepasError } from "./error";
import { ParserErrResult, Parser, CharTestFunc } from "./types";

export function fail(
  input: string,
  message?: string,
  fatal?: boolean
): ParserErrResult;
export function fail(
  errRes: ParserErrResult,
  input: string,
  message?: string,
  fatal?: boolean
): ParserErrResult;
export function fail(
  arg0: ParserErrResult | string,
  arg1?: string,
  arg2?: boolean | string,
  arg3?: boolean
): ParserErrResult {
  const result: ParserErrResult =
    typeof arg0 === "string"
      ? { ok: false, rest: arg0, stack: [] }
      : { ...arg0 };
  const input = (typeof arg0 === "string" ? arg0 : arg1)!;
  const message = (typeof arg0 === "string" ? arg1 : arg2) as
    | string
    | undefined;
  if (message === undefined) {
    return result;
  }
  const fatal = !!(typeof arg0 === "string" ? arg2 : arg3);
  result.stack = [...result.stack, { input, message }];
  if (fatal) {
    throw new RepasError(result);
  }
  return result;
}

export const debug =
  <T>(parser: Parser<T>, name?: string): Parser<T> =>
  (input: string, message?: string) => {
    const result = parser(input, message);
    if (name) {
      console.log(name + ":", result);
    } else {
      console.log(result);
    }
    return result;
  };

export const locate = (
  rest: string,
  input: string
): {
  line: number;
  column: number;
} => {
  const index = input.length - rest.length;
  const lines = input.slice(0, index).split("\n");
  const line = lines.length - 1;
  const column = lines[line].length;
  return { line, column };
};

// TODO
export const displayErrRes = (
  errRes: ParserErrResult,
  source: string
): string => {
  const { stack } = errRes;
  const lines = source.split("\n");
  stack.forEach(({ input, message }) => {
    const { line, column } = locate(input, source);
  });
  return "";
};

export type Range = [string, string] | string;
export type CodeRange = [number, number] | number;

export const range = (start: string, end: string) => (char: string) =>
  char >= start && char <= end;

export const ranges =
  (...ranges: (Range | CharTestFunc)[]) =>
  (char: string, input: string) =>
    ranges.some((range) => {
      if (Array.isArray(range)) {
        const [start, end] = range;
        return char >= start && char <= end;
      } else if (typeof range === "function") {
        return range(char, input);
      }
      return char === range;
    });

export const codeRange =
  (start: number, end: number) => (_char: string, input: string) => {
    const code = input.codePointAt(0)!;
    const len = String.fromCodePoint(code).length;
    if (code >= start && code <= end) {
      return len;
    }
    return false;
  };

export const codeRanges =
  (...ranges: (CodeRange | CharTestFunc)[]): CharTestFunc =>
  (char: string, input: string) => {
    const code = input.codePointAt(0)!;
    const len = String.fromCodePoint(code).length;
    for (const range of ranges) {
      if (Array.isArray(range)) {
        const [start, end] = range;
        if (code >= start && code <= end) {
          return len;
        }
      } else if (typeof range === "function") {
        const res = Number(range(char, input));
        if (res) {
          return res;
        }
      }
      if (code === range) {
        return len;
      }
    }
    return false;
  };

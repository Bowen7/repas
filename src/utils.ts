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
  index: number;
} => {
  const index = input.length - rest.length;
  const lines = input.slice(0, index).split("\n");
  const line = lines.length - 1;
  const column = lines[line].length;
  return { line, column, index };
};

const isBrowser =
  (typeof window !== "undefined" && typeof window.document !== "undefined") ||
  (typeof self === "object" &&
    self.constructor &&
    self.constructor.name === "DedicatedWorkerGlobalScope");

const printHighlightErrCode = (
  startCode: string,
  errCode: string,
  endCode: string
) => {
  if (isBrowser) {
    console.log("%s%c%s%c%s", startCode, "color:red;", errCode, "", endCode);
  } else {
    console.log("%s\x1b[31m%s\x1b[0m%s", startCode, errCode, endCode);
  }
};

export const printErrRes = (
  errRes: ParserErrResult,
  source: string
): string => {
  const { stack, rest } = errRes;
  const lines = source.split("\n");
  stack.forEach(({ input, message }) => {
    const {
      line: inputLine,
      column: inputColumn,
      index: inputIndex,
    } = locate(input, source);
    const {
      line: restLine,
      column: restColumn,
      index: restIndex,
    } = locate(rest, source);
    const startCode = lines[inputLine].slice(0, inputColumn);
    const errCode = source.slice(inputIndex, restIndex + 1);
    const endCode = lines[restLine].slice(restColumn + 1);
    printHighlightErrCode(startCode, errCode, endCode);
    console.log(message);
    console.log("at line", inputLine + 1, "column", inputColumn + 1);
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

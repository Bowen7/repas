import { ParserErrResult, ErrMessage } from "./types";

export const fail = (
  errRes: ParserErrResult | string,
  message?: ErrMessage
): ParserErrResult => {
  const result: ParserErrResult =
    typeof errRes === "string"
      ? { ok: false, rest: errRes, fatal: false, stack: [] }
      : { ...errRes };

  if (!message) {
    return result;
  }
  const nextStack = result.stack.slice();
  result.stack = nextStack;

  if (typeof message === "string") {
    nextStack.push({ kind: "", value: message });
  } else {
    const { fatal, ...msg } = message;
    if (typeof fatal === "boolean") {
      result.fatal = fatal;
    }
    nextStack.push(msg);
  }
  return result;
};

// TODO: pretty print error
export const displayErr = (errRes: ParserErrResult): string => {
  const stack = errRes.stack;
  return stack.map((err) => err.value).join("\n");
};

export type Range = [string, string] | string;
export type CodeRange = [number, number] | number;
export type RangeFunc = (_char: string) => boolean;

export const range = (start: string, end: string) => (char: string) =>
  char >= start && char <= end;

export const ranges =
  (...ranges: (Range | RangeFunc)[]) =>
  (char: string) =>
    ranges.some((range) => {
      if (Array.isArray(range)) {
        const [start, end] = range;
        return char >= start && char <= end;
      } else if (typeof range === "function") {
        return range(char);
      }
      return char === range;
    });

export const codeRange = (start: number, end: number) => (char: string) => {
  const code = char.charCodeAt(0);
  return code >= start && code <= end;
};
export const codeRanges =
  (...ranges: (CodeRange | RangeFunc)[]) =>
  (char: string) => {
    const code = char.charCodeAt(0);
    return ranges.some((range) => {
      if (Array.isArray(range)) {
        const [start, end] = range;
        return code >= start && code <= end;
      } else if (typeof range === "function") {
        return range(char);
      }
      return code === range;
    });
  };

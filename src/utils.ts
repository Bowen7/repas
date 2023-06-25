import { ParserErrResult, ErrMessage } from "./types";

export const pushErrorStack = (
  errRes: ParserErrResult,
  message?: ErrMessage
): ParserErrResult => {
  if (!message) {
    return errRes;
  }
  const nextStack = errRes.stack.slice();
  const nextErrRes = {
    ...errRes,
    stack: nextStack,
  };
  if (typeof message === "string") {
    nextStack.push({ kind: "", value: message });
  } else {
    const { fatal, ...msg } = message;
    if (typeof fatal === "boolean") {
      nextErrRes.fatal = fatal;
    }
    nextStack.push(msg);
  }
  return nextErrRes;
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

import { ParserErrResult, ErrMessage, Parser } from "./types";

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

export const debug =
  <T>(parser: Parser<T>, name?: string): Parser<T> =>
  (input: string, message?: ErrMessage) => {
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

export const defaultMsgMapper = (msg: { kind: string; value: string }) =>
  msg.value;

export const displayErrRes = (
  errRes: ParserErrResult,
  input: string,
  msgMapper = defaultMsgMapper
): string => {
  const { line, column } = locate(errRes.rest, input);
  const lines = input.split("\n");
  const stack = errRes.stack;
  const curLine = lines[line];
  let message = "\n" + curLine + "\n";
  message += " ".repeat(column) + "^\n";
  message += `at line: ${line}, column: ${column}\n`;
  message += stack.map(msgMapper).join("\n");
  return message;
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

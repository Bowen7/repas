import { isSpace } from "./character";
import { Parser, ParserResult } from "./types";
import { pushErrorStack } from "./utils";
import { more0, take1 } from "./repeat";
import { errRes } from "./error";

export const space0 = more0(isSpace);
export const space = take1(isSpace);

export const newline: Parser<string> = (input: string, message?: string) => {
  if (input[0] === "\n") {
    return { ok: true, rest: input.slice(1), value: "\n" };
  } else if (input[0] === "\r" && input[1] === "\n") {
    return { ok: true, rest: input.slice(2), value: "\r\n" };
  }
  return pushErrorStack(errRes(input), message);
};

export const eof = (input: string, message?: string): ParserResult<string> => {
  if (input.length === 0) {
    return { ok: true, rest: input, value: "" };
  }
  return pushErrorStack(errRes(input), message || "expect end of file");
};

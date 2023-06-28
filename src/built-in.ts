import { isSpace } from "./character";
import { Parser, ParserResult, ErrMessage } from "./types";
import { fail } from "./utils";
import { more0, take1 } from "./repeat";

export const space0 = more0(isSpace);
export const space = take1(isSpace);

export const newline: Parser<string> = (
  input: string,
  message?: ErrMessage
) => {
  if (input[0] === "\n") {
    return { ok: true, rest: input.slice(1), value: "\n" };
  } else if (input[0] === "\r" && input[1] === "\n") {
    return { ok: true, rest: input.slice(2), value: "\r\n" };
  }
  return fail(input, message);
};

export const eof = (
  input: string,
  message?: ErrMessage
): ParserResult<string> => {
  if (input.length === 0) {
    return { ok: true, rest: input, value: "" };
  }
  return fail(input, message);
};

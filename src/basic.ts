import { ParserResult, ErrMessage } from "./types";
import { fail } from "./utils";

export const tag =
  (str: string) =>
  (input: string, message?: ErrMessage): ParserResult<string> => {
    if (str === input.slice(0, str.length)) {
      return {
        ok: true,
        rest: input.slice(str.length),
        value: str,
      };
    }
    return fail(input, message);
  };

export const regex = (r: RegExp) => {
  return (input: string, message?: ErrMessage): ParserResult<string> => {
    const m = input.match(r);
    if (m) {
      return {
        ok: true,
        rest: input.slice(m[0].length),
        value: m[0],
      };
    }
    return fail(input, message);
  };
};

export const oneOf = (str: string) => {
  const map = {} as { [key: string]: true };
  for (const c of str) {
    map[c] = true;
  }
  return (input: string, message?: ErrMessage): ParserResult<string> => {
    const char = input[0];
    if (char in map) {
      return {
        ok: true,
        rest: input.slice(1),
        value: char,
      };
    }
    return fail(input, message);
  };
};

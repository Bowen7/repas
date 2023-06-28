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
    return fail(input, message || { kind: "tag", value: str });
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
    return fail(input, message || { kind: "regex", value: r.toString() });
  };
};

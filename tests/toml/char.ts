import {
  isAlphanumeric,
  codeRanges,
  isSpace,
  ParserResult,
  isHexDigit,
  alt,
  range,
} from "src";

export const isDigit07 = range("0", "7");
export const isDigit01 = range("0", "1");

export const isNonAscii = codeRanges([0x80, 0xd7ff], [0xe000, 0x10ffff]);

export const isAllowedCommentChar = codeRanges(
  [0x01, 0x00],
  [0x0e, 0x7f],
  isNonAscii
);

const isBasicUnescaped = codeRanges(
  0x21,
  [0x23, 0x5b],
  [0x5d, 0x7e],
  isSpace,
  isNonAscii
);

export const basicUnescaped = (input: string): ParserResult<string> => {
  const char = input[0];
  if (isBasicUnescaped(char)) {
    return {
      ok: true,
      rest: input.slice(1),
      value: char,
    };
  }
  return {
    ok: false,
    fatal: false,
    rest: input,
    stack: [],
  };
};

const escapeSeqCharMap = {
  '"': '"',
  "\\": "\\",
  b: "\b",
  e: "\u001b",
  f: "\f",
  n: "\n",
  r: "\r",
  t: "\t",
};
export const escaped = (input: string): ParserResult<string> => {
  if (input[0] !== "\\") {
    return {
      ok: false,
      rest: input,
      fatal: false,
      stack: [
        {
          kind: "unsupported.char",
          value: input[0],
        },
      ],
    };
  }
  const char = input[1];
  if (char in escapeSeqCharMap) {
    return {
      ok: true,
      rest: input.slice(2),
      value: escapeSeqCharMap[char as keyof typeof escapeSeqCharMap],
    };
  }
  if (char === "x") {
    if (isHexDigit(input[2]) && isHexDigit(input[3])) {
      return {
        ok: true,
        rest: input.slice(4),
        value: String.fromCharCode(parseInt(input.slice(2, 4), 16)),
      };
    }
    return {
      ok: false,
      rest: input,
      fatal: false,
      stack: [
        {
          kind: "invalid.unicode",
          value: input.slice(0, isHexDigit(input[2]) ? 3 : 2),
        },
      ],
    };
  }
  if (char === "u") {
    let len = 0;
    for (let i = 2; i < 10; i++) {
      if (isHexDigit(input[i])) {
        len++;
      } else {
        break;
      }
    }
    if (len === 4 || len === 8) {
      const code = parseInt(input.slice(2, 2 + len), 16);
      const value = String.fromCharCode(code);
      return {
        ok: true,
        rest: input.slice(2 + len),
        value,
      };
    }
    return {
      ok: false,
      rest: input,
      fatal: false,
      stack: [
        {
          kind: "invalid.unicode",
          value: input.slice(0, 2 + len),
        },
      ],
    };
  }
  return {
    ok: false,
    rest: input,
    fatal: false,
    stack: [
      {
        kind: "unknown.escape",
        value: input.slice(0, 2),
      },
    ],
  };
};

export const basicChar = alt([basicUnescaped, escaped]);

export const isLiteralChar = codeRanges(
  0x09,
  [0x20, 0x26],
  [0x28, 0x7e],
  isNonAscii
);
export const literalChar = (input: string): ParserResult<string> => {
  const char = input[0];
  if (isLiteralChar(char)) {
    return {
      ok: true,
      rest: input.slice(1),
      value: char,
    };
  }
  return {
    ok: false,
    fatal: false,
    rest: input,
    stack: [],
  };
};

export const isUnquotedKeyCode = codeRanges(
  0x2d,
  0x5f,
  0xb2,
  0xb3,
  0xb9,
  [0xbc, 0xbe],
  [0xc0, 0xd6],
  [0xd8, 0xf6],
  [0xf8, 0x37d],
  [0x37f, 0x1fff],
  0x200c,
  0x200d,
  [0x203f, 0x2040],
  [0x2070, 0x218f],
  [0x2460, 0x24ff],
  [0x2c00, 0x2fef],
  [0x3001, 0xd7ff],
  [0xf900, 0xfdcf],
  [0xfdf0, 0xfffd],
  [0x10000, 0xeffff]
);

export const isUnquotedKeyChar = (char: string) =>
  isAlphanumeric(char) || isUnquotedKeyCode(char);

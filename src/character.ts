export const isSpace = (char: string) => {
  if (char === " " || char === "\t") {
    return true;
  }
  return false;
};

export const isNewline = (char: string) => {
  if (char === "\n") {
    return true;
  }
  return false;
};

export const isLineEnding = (char: string) => {
  if (char === "\n" || char === "\r") {
    return true;
  }
  return false;
};

export const isDigit = (char: string) => char >= "0" && char <= "9";

export const isHexDigit = (char: string) =>
  (char >= "a" && char <= "f") || (char >= "A" && char <= "F") || isDigit(char);

export const isAlphabetic = (char: string) =>
  (char >= "a" && char <= "z") || (char >= "A" && char <= "Z");

export const isAlphanumeric = (char: string) =>
  isAlphabetic(char) || isDigit(char);

export const isDigit19 = (char: string) => char >= "1" && char <= "9";

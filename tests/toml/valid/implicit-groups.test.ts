import { expect, test } from "vitest";
import { parseTOML } from "../index";
test("implicit groups", () => {
  const toml = `
    [a.b.c]
    answer = 42
`;
  expect(parseTOML(toml)).toEqual({
    a: {
      b: {
        c: {
          answer: 42,
        },
      },
    },
  });
});

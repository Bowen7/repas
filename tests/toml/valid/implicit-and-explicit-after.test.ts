import { expect, test } from "vitest";
import { parseTOML } from "../index";
test("implicit and explicit after", () => {
  const toml = `
    [a.b.c]
    answer = 42
    
    [a]
    better = 43
`;
  expect(parseTOML(toml)).toEqual({
    a: {
      b: {
        c: {
          answer: 42,
        },
      },
      better: 43,
    },
  });
});

import { expect, test } from "vitest";
import { parseTOML } from "../index";
test("implicit and explicit before", () => {
  const toml = `
    [a]
    better = 43
    
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
      better: 43,
    },
  });
});

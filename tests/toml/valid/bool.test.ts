import { expect, test, describe } from "vitest";
import { parseTOML } from "../index";
describe("bool", () => {
  test("bool", () => {
    const toml = `
t = true
f = false
`;
    expect(parseTOML(toml)).toEqual({
      f: false,
      t: true,
    });
  });
});

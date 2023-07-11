import { expect, test, describe } from "vitest";
import { parseTOML } from "../index";
describe("empty file", () => {
  test("bool", () => {
    const toml = ``;
    expect(parseTOML(toml)).toEqual({});
  });
});

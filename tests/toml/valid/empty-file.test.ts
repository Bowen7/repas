import { expect, test, describe } from "vitest";
import { parseTOML } from "../index";
test("empty file", () => {
  const toml = ``;
  expect(parseTOML(toml)).toEqual({});
});

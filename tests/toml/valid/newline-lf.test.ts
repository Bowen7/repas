import { expect, test } from "vitest";
import { parseTOML } from "../index";
test("newline lf", () => {
  const toml = `
    os = "unix"
    newline = "lf"
`;
  expect(parseTOML(toml)).toEqual({
    newline: "lf",
    os: "unix",
  });
});

import { expect, test } from "vitest";
import { parseTOML } from "../index";
test("newline crlf", () => {
  const toml = `
    os = "DOS"
    newline = "crlf"
`;
  expect(parseTOML(toml)).toEqual({
    newline: "crlf",
    os: "DOS",
  });
});

import { expect, test } from "vitest";
import { parseTOML } from "../index";

test("parse bool", () => {
  const toml = `
# This is a full-line comment
key = "value" # This is a comment at the end of a line  
`;
  expect(parseTOML(toml)).toEqual({
    key: "value",
  });
});

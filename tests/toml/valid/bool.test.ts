import { expect, test } from "vitest";
import { parseTOML } from "../index";

test("parse bool", () => {
  const toml = `
t = true
f = false  
`;
  expect(parseTOML(toml)).toEqual({
    f: false,
    t: true,
  });
});

import { expect, test, describe } from "vitest";
import { parseTOML } from "../index";

describe("array", () => {
  test("double-comma-1", () => {
    const toml = `
array = [1,,2]
`;
    expect(() => parseTOML(toml)).toThrowError(SyntaxError);
  });

  test("double-comma-2", () => {
    const toml = `
array = [1,2,,]

`;
    expect(() => parseTOML(toml)).toThrowError(SyntaxError);
  });

  test("extending-table", () => {
    const toml = `
a = [{ b = 1 }]

# Cannot extend tables within static arrays
# https://github.com/toml-lang/toml/issues/908
[a.c]
foo = 1
`;
    expect(() => parseTOML(toml)).toThrowError(SyntaxError);
  });

  test("missing-separator", () => {
    const toml = `
wrong = [ 1 2 3 ]
`;
    expect(() => parseTOML(toml)).toThrowError(SyntaxError);
  });

  test("no-close-2", () => {
    const toml = `
x = [42 #
`;
    expect(() => parseTOML(toml)).toThrowError(SyntaxError);
  });

  test("no-close-table-2", () => {
    const toml = `
x = [{ key = 42 #
`;
    expect(() => parseTOML(toml)).toThrowError(SyntaxError);
  });

  test("no-close-table", () => {
    const toml = `
x = [{ key = 42
`;
    expect(() => parseTOML(toml)).toThrowError(SyntaxError);
  });

  test("no-close", () => {
    const toml = `
long_array = [ 1, 2, 3
`;
    expect(() => parseTOML(toml)).toThrowError(SyntaxError);
  });

  test("tables-1", () => {
    const toml = `
# INVALID TOML DOC
fruit = []

[[fruit]] # Not allowed
`;
    expect(() => parseTOML(toml)).toThrowError(SyntaxError);
  });

  test("tables-2", () => {
    const toml = `
# INVALID TOML DOC
[[fruit]]
  name = "apple"

  [[fruit.variety]]
    name = "red delicious"

  # This table conflicts with the previous table
  [fruit.variety]
    name = "granny smith"
`;
    expect(() => parseTOML(toml)).toThrowError(SyntaxError);
  });

  test("text-after-array-entries", () => {
    const toml = `
array = [
  "Is there life after an array separator?", No
  "Entry"
]
`;
    expect(() => parseTOML(toml)).toThrowError(SyntaxError);
  });

  test("text-before-array-separator", () => {
    const toml = `
array = [
  "Is there life before an array separator?" No,
  "Entry"
]
`;
    expect(() => parseTOML(toml)).toThrowError(SyntaxError);
  });

  test("text-in-array", () => {
    const toml = `
array = [
  "Entry 1",
  I don't belong,
  "Entry 2",
]
`;
    expect(() => parseTOML(toml)).toThrowError(SyntaxError);
  });
});

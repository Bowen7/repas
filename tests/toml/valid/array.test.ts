import { describe, expect, test } from "vitest";
import { parseTOML } from "../index";

describe("parse array", () => {
  test("array", () => {
    const toml = `
ints = [1, 2, 3, ]
floats = [1.1, 2.1, 3.1]
strings = ["a", "b", "c"]
dates = [
  1987-07-05T17:45:00Z,
  1979-05-27T07:32:00Z,
  2006-06-01T11:00:00Z,
]
comments = [
         1,
         2, #this is ok
]
`;
    expect(parseTOML(toml)).toEqual({
      comments: [1, 2],
      dates: [
        {
          type: "datetime",
          value: "1987-07-05T17:45:00Z",
        },
        {
          type: "datetime",
          value: "1979-05-27T07:32:00Z",
        },
        {
          type: "datetime",
          value: "2006-06-01T11:00:00Z",
        },
      ],
      floats: [1.1, 2.1, 3.1],
      ints: [1, 2, 3],
      strings: ["a", "b", "c"],
    });
  });

  test("nested array", () => {
    const toml = `
nest = [
  [
    ["a"],
    [1, 2, [3]]
  ]
]    
    `;
    expect(parseTOML(toml)).toEqual({
      nest: [[["a"], [1, 2, [3]]]],
    });
  });

  test("empty array", () => {
    const toml = `thevoid = [[[[[]]]]]`;
    expect(parseTOML(toml)).toEqual({
      thevoid: [[[[[]]]]],
    });
  });
});

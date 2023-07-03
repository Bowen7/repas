import { expect, test, describe } from "vitest";
import { parseTOML } from "../index";
describe("array", () => {
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

  test("bool", () => {
    const toml = `
a = [true, false]
`;
    expect(parseTOML(toml)).toEqual({
      a: [true, false],
    });
  });

  test("empty", () => {
    const toml = `
thevoid = [[[[[]]]]]
`;
    expect(parseTOML(toml)).toEqual({
      thevoid: [[[[[]]]]],
    });
  });

  test("hetergeneous", () => {
    const toml = `
mixed = [[1, 2], ["a", "b"], [1.1, 2.1]]
`;
    expect(parseTOML(toml)).toEqual({
      mixed: [
        [1, 2],
        ["a", "b"],
        [1.1, 2.1],
      ],
    });
  });

  test("mixed-int-array", () => {
    const toml = `
arrays-and-ints =  [1, ["Arrays are not integers."]]
`;
    expect(parseTOML(toml)).toEqual({
      "arrays-and-ints": [1, ["Arrays are not integers."]],
    });
  });

  test("mixed-int-float", () => {
    const toml = `
ints-and-floats = [1, 1.1]
`;
    expect(parseTOML(toml)).toEqual({
      "ints-and-floats": [1, 1.1],
    });
  });

  test("mixed-int-string", () => {
    const toml = `
strings-and-ints = ["hi", 42]
`;
    expect(parseTOML(toml)).toEqual({
      "strings-and-ints": ["hi", 42],
    });
  });

  test("mixed-string-table", () => {
    const toml = `
contributors = [
  "Foo Bar <foo@example.com>",
  { name = "Baz Qux", email = "bazqux@example.com", url = "https://example.com/bazqux" }
]

# Start with a table as the first element. This tests a case that some libraries
# might have where they will check if the first entry is a table/map/hash/assoc
# array and then encode it as a table array. This was a reasonable thing to do
# before TOML 1.0 since arrays could only contain one type, but now it's no
# longer.
mixed = [{k="a"}, "b", 1]
`;
    expect(parseTOML(toml)).toEqual({
      contributors: [
        "Foo Bar <foo@example.com>",
        {
          email: "bazqux@example.com",
          name: "Baz Qux",
          url: "https://example.com/bazqux",
        },
      ],
      mixed: [
        {
          k: "a",
        },
        "b",
        1,
      ],
    });
  });

  test("nested-double", () => {
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

  test("nested-inline-table", () => {
    const toml = `
a = [ { b = {} } ]
`;
    expect(parseTOML(toml)).toEqual({
      a: [
        {
          b: {},
        },
      ],
    });
  });

  test("nested", () => {
    const toml = `
nest = [["a"], ["b"]]
`;
    expect(parseTOML(toml)).toEqual({
      nest: [["a"], ["b"]],
    });
  });

  test("nospaces", () => {
    const toml = `
ints = [1,2,3]
`;
    expect(parseTOML(toml)).toEqual({
      ints: [1, 2, 3],
    });
  });

  test("string-quote-comma-2", () => {
    const toml = `
title = [ " \\", ",]
`;
    expect(parseTOML(toml)).toEqual({
      title: [' ", '],
    });
  });

  test("string-quote-comma", () => {
    const toml = `
title = [
"Client: \\"XXXX\\", Job: XXXX",
"Code: XXXX"
]
`;
    expect(parseTOML(toml)).toEqual({
      title: ['Client: "XXXX", Job: XXXX', "Code: XXXX"],
    });
  });

  test("string-with-comma-2", () => {
    const toml = `
title = [
"""Client: XXXX,
Job: XXXX""",
"Code: XXXX"
]
`;
    expect(parseTOML(toml)).toEqual({
      title: ["Client: XXXX,\nJob: XXXX", "Code: XXXX"],
    });
  });

  test("string-with-comma", () => {
    const toml = `
title = [
"Client: XXXX, Job: XXXX",
"Code: XXXX"
]
`;
    expect(parseTOML(toml)).toEqual({
      title: ["Client: XXXX, Job: XXXX", "Code: XXXX"],
    });
  });

  test("strings", () => {
    const toml = `
string_array = [ "all", 'strings', """are the same""", '''type''']
`;
    expect(parseTOML(toml)).toEqual({
      string_array: ["all", "strings", "are the same", "type"],
    });
  });

  test("table-array-string-backslash", () => {
    const toml = `
foo = [ { bar="\\"{{baz}}\\""} ]
`;
    expect(parseTOML(toml)).toEqual({
      foo: [
        {
          bar: '"{{baz}}"',
        },
      ],
    });
  });
});

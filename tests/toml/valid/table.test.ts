import { expect, test, describe } from "vitest";
import { parseTOML } from "../index";
describe("table", () => {
  test("array-implicit-and-explicit-after", () => {
    const toml = `
[[a.b]]
x = 1

[a]
y = 2
`;
    expect(parseTOML(toml)).toEqual({
      a: {
        b: [
          {
            x: 1,
          },
        ],
        y: 2,
      },
    });
  });

  test("array-implicit", () => {
    const toml = `
[[albums.songs]]
name = "Glory Days"
`;
    expect(parseTOML(toml)).toEqual({
      albums: {
        songs: [
          {
            name: "Glory Days",
          },
        ],
      },
    });
  });

  test("array-many", () => {
    const toml = `
[[people]]
first_name = "Bruce"
last_name = "Springsteen"

[[people]]
first_name = "Eric"
last_name = "Clapton"

[[people]]
first_name = "Bob"
last_name = "Seger"
`;
    expect(parseTOML(toml)).toEqual({
      people: [
        {
          first_name: "Bruce",
          last_name: "Springsteen",
        },
        {
          first_name: "Eric",
          last_name: "Clapton",
        },
        {
          first_name: "Bob",
          last_name: "Seger",
        },
      ],
    });
  });

  test("array-nest", () => {
    const toml = `
[[albums]]
name = "Born to Run"

  [[albums.songs]]
  name = "Jungleland"

  [[albums.songs]]
  name = "Meeting Across the River"

[[albums]]
name = "Born in the USA"
  
  [[albums.songs]]
  name = "Glory Days"

  [[albums.songs]]
  name = "Dancing in the Dark"
`;
    expect(parseTOML(toml)).toEqual({
      albums: [
        {
          name: "Born to Run",
          songs: [
            {
              name: "Jungleland",
            },
            {
              name: "Meeting Across the River",
            },
          ],
        },
        {
          name: "Born in the USA",
          songs: [
            {
              name: "Glory Days",
            },
            {
              name: "Dancing in the Dark",
            },
          ],
        },
      ],
    });
  });

  test("array-one", () => {
    const toml = `
[[people]]
first_name = "Bruce"
last_name = "Springsteen"
`;
    expect(parseTOML(toml)).toEqual({
      people: [
        {
          first_name: "Bruce",
          last_name: "Springsteen",
        },
      ],
    });
  });

  test("array-table-array", () => {
    const toml = `
[[a]]
    [[a.b]]
        [a.b.c]
            d = "val0"
    [[a.b]]
        [a.b.c]
            d = "val1"
`;
    expect(parseTOML(toml)).toEqual({
      a: [
        {
          b: [
            {
              c: {
                d: "val0",
              },
            },
            {
              c: {
                d: "val1",
              },
            },
          ],
        },
      ],
    });
  });

  test("array-within-dotted", () => {
    const toml = `
[fruit]
apple.color = "red"

[[fruit.apple.seeds]]
size = 2
`;
    expect(parseTOML(toml)).toEqual({
      fruit: {
        apple: {
          color: "red",
          seeds: [
            {
              size: 2,
            },
          ],
        },
      },
    });
  });

  test("empty-name", () => {
    const toml = `
['']
x = 1

["".a]
x = 2

[a.'']
x = 3
`;
    expect(parseTOML(toml)).toEqual({
      "": {
        x: 1,
        a: {
          x: 2,
        },
      },
      a: {
        "": {
          x: 3,
        },
      },
    });
  });

  test("empty", () => {
    const toml = `
[a]
`;
    expect(parseTOML(toml)).toEqual({
      a: {},
    });
  });

  test("keyword", () => {
    const toml = `
[true]

[false]

[inf]

[nan]


`;
    expect(parseTOML(toml)).toEqual({
      true: {},
      false: {},
      inf: {},
      nan: {},
    });
  });

  test("names", () => {
    const toml = `
[a.b.c]
[a."b.c"]
[a.'d.e']
[a.' x ']
[ d.e.f ]
[ g . h . i ]
[ j . "ʞ" . 'l' ]

[x.1.2]
`;
    expect(parseTOML(toml)).toEqual({
      a: {
        " x ": {},
        b: {
          c: {},
        },
        "b.c": {},
        "d.e": {},
      },
      d: {
        e: {
          f: {},
        },
      },
      g: {
        h: {
          i: {},
        },
      },
      j: {
        ʞ: {
          l: {},
        },
      },
      x: {
        "1": {
          "2": {},
        },
      },
    });
  });

  test("no-eol", () => {
    const toml = `
[table]
`;
    expect(parseTOML(toml)).toEqual({
      table: {},
    });
  });

  test("sub-empty", () => {
    const toml = `
[a]
[a.b]
`;
    expect(parseTOML(toml)).toEqual({
      a: {
        b: {},
      },
    });
  });

  test("sub", () => {
    const toml = `
[a]
key = 1

# a.extend is a key inside the "a" table.
[a.extend]
key = 2

[a.extend.more]
key = 3
`;
    expect(parseTOML(toml)).toEqual({
      a: {
        extend: {
          key: 2,
          more: {
            key: 3,
          },
        },
        key: 1,
      },
    });
  });

  test("whitespace", () => {
    const toml = `
["valid key"]
`;
    expect(parseTOML(toml)).toEqual({
      "valid key": {},
    });
  });

  test("with-literal-string", () => {
    const toml = `
['a']
[a.'"b"']
[a.'"b"'.c]
answer = 42 
`;
    expect(parseTOML(toml)).toEqual({
      a: {
        '"b"': {
          c: {
            answer: 42,
          },
        },
      },
    });
  });

  test("with-pound", () => {
    const toml = `
["key#group"]
answer = 42
`;
    expect(parseTOML(toml)).toEqual({
      "key#group": {
        answer: 42,
      },
    });
  });

  test("with-single-quotes", () => {
    const toml = `
['a']
[a.'b']
[a.'b'.c]
answer = 42 
`;
    expect(parseTOML(toml)).toEqual({
      a: {
        b: {
          c: {
            answer: 42,
          },
        },
      },
    });
  });

  test("without-super", () => {
    const toml = `
# [x] you
# [x.y] don't
# [x.y.z] need these
[x.y.z.w] # for this to work
[x] # defining a super-table afterwards is ok
`;
    expect(parseTOML(toml)).toEqual({
      x: {
        y: {
          z: {
            w: {},
          },
        },
      },
    });
  });
});

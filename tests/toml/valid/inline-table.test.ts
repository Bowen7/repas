import { expect, test, describe } from "vitest";
import { parseTOML } from "../index";
describe("inline-table", () => {
  test("array", () => {
    const toml = `
people = [{first_name = "Bruce", last_name = "Springsteen"},
          {first_name = "Eric", last_name = "Clapton"},
          {first_name = "Bob", last_name = "Seger"}]
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

  test("bool", () => {
    const toml = `
a = {a = true, b = false}
`;
    expect(parseTOML(toml)).toEqual({
      a: {
        a: true,
        b: false,
      },
    });
  });

  test("empty", () => {
    const toml = `
empty1 = {}
empty2 = { }
empty_in_array = [ { not_empty = 1 }, {} ]
empty_in_array2 = [{},{not_empty=1}]
many_empty = [{},{},{}]
nested_empty = {"empty"={}}
`;
    expect(parseTOML(toml)).toEqual({
      empty1: {},
      empty2: {},
      empty_in_array: [
        {
          not_empty: 1,
        },
        {},
      ],
      empty_in_array2: [
        {},
        {
          not_empty: 1,
        },
      ],
      many_empty: [{}, {}, {}],
      nested_empty: {
        empty: {},
      },
    });
  });

  test("end-in-bool", () => {
    const toml = `
black = { python=">3.6", version=">=18.9b0", allow_prereleases=true }
`;
    expect(parseTOML(toml)).toEqual({
      black: {
        allow_prereleases: true,
        python: ">3.6",
        version: ">=18.9b0",
      },
    });
  });

  test("inline-table", () => {
    const toml = `
name = { first = "Tom", last = "Preston-Werner" }
point = { x = 1, y = 2 }
simple = { a = 1 }
str-key = { "a" = 1 }
table-array = [{ "a" = 1 }, { "b" = 2 }]
`;
    expect(parseTOML(toml)).toEqual({
      name: {
        first: "Tom",
        last: "Preston-Werner",
      },
      point: {
        x: 1,
        y: 2,
      },
      simple: {
        a: 1,
      },
      "str-key": {
        a: 1,
      },
      "table-array": [
        {
          a: 1,
        },
        {
          b: 2,
        },
      ],
    });
  });

  test("key-dotted", () => {
    const toml = `
inline = {a.b = 42}

many.dots.here.dot.dot.dot = {a.b.c = 1, a.b.d = 2}

a = {   a.b  =  1   }
b = {   "a"."b"  =  1   }
c = {   a   .   b  =  1   }
d = {   'a'   .   "b"  =  1   }
e = {a.b=1}

[tbl]
a.b.c = {d.e=1}

[tbl.x]
a.b.c = {d.e=1}

[[arr]]
t = {a.b=1}
T = {a.b=1}

[[arr]]
t = {a.b=2}
T = {a.b=2}
`;
    expect(parseTOML(toml)).toEqual({
      a: {
        a: {
          b: 1,
        },
      },
      arr: [
        {
          T: {
            a: {
              b: 1,
            },
          },
          t: {
            a: {
              b: 1,
            },
          },
        },
        {
          T: {
            a: {
              b: 2,
            },
          },
          t: {
            a: {
              b: 2,
            },
          },
        },
      ],
      b: {
        a: {
          b: 1,
        },
      },
      c: {
        a: {
          b: 1,
        },
      },
      d: {
        a: {
          b: 1,
        },
      },
      e: {
        a: {
          b: 1,
        },
      },
      inline: {
        a: {
          b: 42,
        },
      },
      many: {
        dots: {
          here: {
            dot: {
              dot: {
                dot: {
                  a: {
                    b: {
                      c: 1,
                      d: 2,
                    },
                  },
                },
              },
            },
          },
        },
      },
      tbl: {
        a: {
          b: {
            c: {
              d: {
                e: 1,
              },
            },
          },
        },
        x: {
          a: {
            b: {
              c: {
                d: {
                  e: 1,
                },
              },
            },
          },
        },
      },
    });
  });

  test("multiline", () => {
    const toml = `
tbl_multiline = { a = 1, b = """
multiline
""", c = """and yet
another line""", d = 4 }
`;
    expect(parseTOML(toml)).toEqual({
      tbl_multiline: {
        a: 1,
        b: "multiline\n",
        c: "and yet\nanother line",
        d: 4,
      },
    });
  });

  test("nest", () => {
    const toml = `
tbl_tbl_empty = { tbl_0 = {} }
tbl_tbl_val   = { tbl_1 = { one = 1 } }
tbl_arr_tbl   = { arr_tbl = [ { one = 1 } ] }
arr_tbl_tbl   = [ { tbl = { one = 1 } } ]

# Array-of-array-of-table is interesting because it can only
# be represented in inline form.
arr_arr_tbl_empty = [ [ {} ] ]
arr_arr_tbl_val = [ [ { one = 1 } ] ]
arr_arr_tbls  = [ [ { one = 1 }, { two = 2 } ] ]
`;
    expect(parseTOML(toml)).toEqual({
      arr_arr_tbl_empty: [[{}]],
      arr_arr_tbl_val: [
        [
          {
            one: 1,
          },
        ],
      ],
      arr_arr_tbls: [
        [
          {
            one: 1,
          },
          {
            two: 2,
          },
        ],
      ],
      arr_tbl_tbl: [
        {
          tbl: {
            one: 1,
          },
        },
      ],
      tbl_arr_tbl: {
        arr_tbl: [
          {
            one: 1,
          },
        ],
      },
      tbl_tbl_empty: {
        tbl_0: {},
      },
      tbl_tbl_val: {
        tbl_1: {
          one: 1,
        },
      },
    });
  });

  test("newline", () => {
    const toml = `
# TOML 1.1 supports newlines in inline tables and trailing commas.

trailing-comma-1 = {
	c = 1,
}
trailing-comma-2 = { c = 1, }

tbl-1 = {
	hello = "world",
	1     = 2,
	arr   = [1,
	         2,
	         3,
	        ],
	tbl = {
		 k = 1,
	}
}

tbl-2 = {
	k = """
	Hello
	"""
}
`;
    expect(parseTOML(toml)).toEqual({
      "tbl-1": {
        "1": 2,
        arr: [1, 2, 3],
        hello: "world",
        tbl: {
          k: 1,
        },
      },
      "tbl-2": {
        k: "\tHello\n\t",
      },
      "trailing-comma-1": {
        c: 1,
      },
      "trailing-comma-2": {
        c: 1,
      },
    });
  });
});

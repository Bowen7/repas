import { expect, test, describe } from "vitest";
import { parseTOML } from "../index";
describe("key", () => {
  test("alphanum", () => {
    const toml = `
alpha = "a"
123 = "num"
000111 = "leading"
10e3 = "false float"
one1two2 = "mixed"
with-dash = "dashed"
under_score = "___"
34-11 = 23

[2018_10]
001 = 1

[a-a-a]
_ = false
`;
    expect(parseTOML(toml)).toEqual({
      "123": "num",
      "000111": "leading",
      "10e3": "false float",
      "2018_10": {
        "001": 1,
      },
      "34-11": 23,
      "a-a-a": {
        _: false,
      },
      alpha: "a",
      one1two2: "mixed",
      under_score: "___",
      "with-dash": "dashed",
    });
  });

  test("case-sensitive", () => {
    const toml = `
sectioN = "NN"

[section]
name = "lower"
NAME = "upper"
Name = "capitalized"

[Section]
name = "different section!!"
"μ" = "greek small letter mu"
"Μ" = "greek capital letter MU"
M = "latin letter M"

`;
    expect(parseTOML(toml)).toEqual({
      Section: {
        M: "latin letter M",
        name: "different section!!",
        Μ: "greek capital letter MU",
        μ: "greek small letter mu",
      },
      sectioN: "NN",
      section: {
        NAME: "upper",
        Name: "capitalized",
        name: "lower",
      },
    });
  });

  test("dotted-empty", () => {
    const toml = `
''.x = "empty.x"
x."" = "x.empty"
[a]
"".'' = "empty.empty"
`;
    expect(parseTOML(toml)).toEqual({
      "": {
        x: "empty.x",
      },
      x: {
        "": "x.empty",
      },
      a: {
        "": {
          "": "empty.empty",
        },
      },
    });
  });

  test("dotted", () => {
    const toml = `
# Note: this file contains literal tab characters.

name.first = "Arthur"
"name".'last' = "Dent"

many.dots.here.dot.dot.dot = 42

# Space are ignored, and key parts can be quoted.
count.a       = 1
count . b     = 2
"count"."c"   = 3
"count" . "d" = 4
'count'.'e'   = 5
'count' . 'f' = 6
"count".'g'   = 7
"count" . 'h' = 8
count.'i'     = 9
count 	.	 'j'	   = 10
"count".k     = 11
"count" . l   = 12

[tbl]
a.b.c = 42.666

[a.few.dots]
polka.dot = "again?"
polka.dance-with = "Dot"

[[arr]]
a.b.c=1
a.b.d=2

[[arr]]
a.b.c=3
a.b.d=4
`;
    expect(parseTOML(toml)).toEqual({
      a: {
        few: {
          dots: {
            polka: {
              "dance-with": "Dot",
              dot: "again?",
            },
          },
        },
      },
      arr: [
        {
          a: {
            b: {
              c: 1,
              d: 2,
            },
          },
        },
        {
          a: {
            b: {
              c: 3,
              d: 4,
            },
          },
        },
      ],
      count: {
        a: 1,
        b: 2,
        c: 3,
        d: 4,
        e: 5,
        f: 6,
        g: 7,
        h: 8,
        i: 9,
        j: 10,
        k: 11,
        l: 12,
      },
      many: {
        dots: {
          here: {
            dot: {
              dot: {
                dot: 42,
              },
            },
          },
        },
      },
      name: {
        first: "Arthur",
        last: "Dent",
      },
      tbl: {
        a: {
          b: {
            c: 42.666,
          },
        },
      },
    });
  });

  test("empty", () => {
    const toml = `
"" = "blank"
`;
    expect(parseTOML(toml)).toEqual({
      "": "blank",
    });
  });

  test("equals-nospace", () => {
    const toml = `
answer=42
`;
    expect(parseTOML(toml)).toEqual({
      answer: 42,
    });
  });

  test("escapes", () => {
    const toml = `
"\\n" = "newline"
"\\u00c0" = "latin capital letter A with grave"
"\\"" = "just a quote"

["backsp\\b\\b"]

["\\"quoted\\""]
quote = true

["a.b"."\\u00c0"]
`;
    expect(parseTOML(toml)).toEqual({
      "\n": "newline",
      '"': "just a quote",
      '"quoted"': {
        quote: true,
      },
      "a.b": {
        À: {},
      },
      "backsp\b\b": {},
      À: "latin capital letter A with grave",
    });
  });

  test("numeric-dotted", () => {
    const toml = `
1.2 = 3
`;
    expect(parseTOML(toml)).toEqual({
      "1": {
        "2": 3,
      },
    });
  });

  test("numeric", () => {
    const toml = `
1 = 1
`;
    expect(parseTOML(toml)).toEqual({
      "1": 1,
    });
  });

  test("quoted-dots", () => {
    const toml = `
plain = 1
"with.dot" = 2

[plain_table]
plain = 3
"with.dot" = 4

[table.withdot]
plain = 5
"key.with.dots" = 6
`;
    expect(parseTOML(toml)).toEqual({
      plain: 1,
      plain_table: {
        plain: 3,
        "with.dot": 4,
      },
      table: {
        withdot: {
          "key.with.dots": 6,
          plain: 5,
        },
      },
      "with.dot": 2,
    });
  });

  test("quoted-unicode", () => {
    const toml = `

"\\u0000" = "null"
'\\u0000' = "different key"
"\\u0008 \\u000c \\U00000041 \\u007f \\u0080 \\u00ff \\ud7ff \\ue000 \\uffff \\U00010000 \\U0010ffff" = "escaped key"

"~  ÿ ퟿  ￿ 𐀀 􏿿" = "basic key"
'l ~  ÿ ퟿  ￿ 𐀀 􏿿' = "literal key"
`;
    expect(parseTOML(toml)).toEqual({
      "\u0000": "null",
      "\\u0000": "different key",
      "\b \f A   ÿ ퟿  ￿ 𐀀 􏿿": "escaped key",
      "~  ÿ ퟿  ￿ 𐀀 􏿿": "basic key",
      "l ~  ÿ ퟿  ￿ 𐀀 􏿿": "literal key",
    });
  });

  test("space", () => {
    const toml = `
# Keep whitespace inside quotes keys at all positions.
"a b"   = 1
" c d " = 2

[ " tbl " ]
"\\ttab\\ttab\\t" = "tab"
`;
    expect(parseTOML(toml)).toEqual({
      " c d ": 2,
      " tbl ": {
        "\ttab\ttab\t": "tab",
      },
      "a b": 1,
    });
  });

  test("special-chars", () => {
    const toml = `
"=~!@$^&*()_+-\`1234567890[]|/?><.,;:'=" = 1
`;
    expect(parseTOML(toml)).toEqual({
      "=~!@$^&*()_+-`1234567890[]|/?><.,;:'=": 1,
    });
  });

  test("special-word", () => {
    const toml = `
false = false
true = 1
inf = 100000000
nan = "ceci n'est pas un nombre"

`;
    expect(parseTOML(toml)).toEqual({
      false: false,
      inf: 100000000,
      nan: "ceci n'est pas un nombre",
      true: 1,
    });
  });

  test("unicode", () => {
    const toml = `
# TOML 1.1 supports Unicode for bare keys.

€ = 'Euro'
😂 = "rofl"
a‍b = "zwj"
ÅÅ = "U+00C5 U+0041 U+030A"

[中文]
中文 = {中文 = "Chinese language"}

[[tiếng-Việt]]
tiəŋ˧˦.viət̚˧˨ʔ = "north"

[[tiếng-Việt]]
tiəŋ˦˧˥.viək̚˨˩ʔ = "central"
`;
    expect(parseTOML(toml)).toEqual({
      a‍b: "zwj",
      "tiếng-Việt": [
        {
          "tiəŋ˧˦": {
            "viət̚˧˨ʔ": "north",
          },
        },
        {
          "tiəŋ˦˧˥": {
            "viək̚˨˩ʔ": "central",
          },
        },
      ],
      ÅÅ: "U+00C5 U+0041 U+030A",
      "€": "Euro",
      中文: {
        中文: {
          中文: "Chinese language",
        },
      },
      "😂": "rofl",
    });
  });
});

import { expect, test, describe } from "vitest";
import { parseTOML } from "../index";
describe("spec", () => {
  test("array-0", () => {
    const toml = `
integers = [ 1, 2, 3 ]
colors = [ "red", "yellow", "green" ]
nested_arrays_of_ints = [ [ 1, 2 ], [3, 4, 5] ]
nested_mixed_array = [ [ 1, 2 ], ["a", "b", "c"] ]
string_array = [ "all", 'strings', """are the same""", '''type''' ]

# Mixed-type arrays are allowed
numbers = [ 0.1, 0.2, 0.5, 1, 2, 5 ]
contributors = [
  "Foo Bar <foo@example.com>",
  { name = "Baz Qux", email = "bazqux@example.com", url = "https://example.com/bazqux" }
]
`;
    expect(parseTOML(toml)).toEqual({
      colors: ["red", "yellow", "green"],
      contributors: [
        "Foo Bar <foo@example.com>",
        {
          email: "bazqux@example.com",
          name: "Baz Qux",
          url: "https://example.com/bazqux",
        },
      ],
      integers: [1, 2, 3],
      nested_arrays_of_ints: [
        [1, 2],
        [3, 4, 5],
      ],
      nested_mixed_array: [
        [1, 2],
        ["a", "b", "c"],
      ],
      numbers: [0.1, 0.2, 0.5, 1, 2, 5],
      string_array: ["all", "strings", "are the same", "type"],
    });
  });

  test("array-1", () => {
    const toml = `
integers2 = [
  1, 2, 3
]

integers3 = [
  1,
  2, # this is ok
]
`;
    expect(parseTOML(toml)).toEqual({
      integers2: [1, 2, 3],
      integers3: [1, 2],
    });
  });

  test("array-of-tables-0", () => {
    const toml = `
[[products]]
name = "Hammer"
sku = 738594937

[[products]]  # empty table within the array

[[products]]
name = "Nail"
sku = 284758393

color = "gray"
`;
    expect(parseTOML(toml)).toEqual({
      products: [
        {
          name: "Hammer",
          sku: 738594937,
        },
        {},
        {
          color: "gray",
          name: "Nail",
          sku: 284758393,
        },
      ],
    });
  });

  test("array-of-tables-1", () => {
    const toml = `
[[fruits]]
name = "apple"

[fruits.physical]  # subtable
color = "red"
shape = "round"

[[fruits.varieties]]  # nested array of tables
name = "red delicious"

[[fruits.varieties]]
name = "granny smith"


[[fruits]]
name = "banana"

[[fruits.varieties]]
name = "plantain"
`;
    expect(parseTOML(toml)).toEqual({
      fruits: [
        {
          name: "apple",
          physical: {
            color: "red",
            shape: "round",
          },
          varieties: [
            {
              name: "red delicious",
            },
            {
              name: "granny smith",
            },
          ],
        },
        {
          name: "banana",
          varieties: [
            {
              name: "plantain",
            },
          ],
        },
      ],
    });
  });

  test("array-of-tables-2", () => {
    const toml = `
points = [ { x = 1, y = 2, z = 3 },
           { x = 7, y = 8, z = 9 },
           { x = 2, y = 4, z = 8 } ]
`;
    expect(parseTOML(toml)).toEqual({
      points: [
        {
          x: 1,
          y: 2,
          z: 3,
        },
        {
          x: 7,
          y: 8,
          z: 9,
        },
        {
          x: 2,
          y: 4,
          z: 8,
        },
      ],
    });
  });

  test("boolean-0", () => {
    const toml = `
bool1 = true
bool2 = false
`;
    expect(parseTOML(toml)).toEqual({
      bool1: true,
      bool2: false,
    });
  });

  test("comment-0", () => {
    const toml = `
# This is a full-line comment
key = "value"  # This is a comment at the end of a line
another = "# This is not a comment"
`;
    expect(parseTOML(toml)).toEqual({
      another: "# This is not a comment",
      key: "value",
    });
  });

  test("float-0", () => {
    const toml = `
# fractional
flt1 = +1.0
flt2 = 3.1415
flt3 = -0.01

# exponent
flt4 = 5e+22
flt5 = 1e06
flt6 = -2E-2

# both
flt7 = 6.626e-34
`;
    expect(parseTOML(toml)).toEqual({
      flt1: 1,
      flt2: 3.1415,
      flt3: -0.01,
      flt4: 5e22,
      flt5: 1000000,
      flt6: -0.02,
      flt7: 6.626e-34,
    });
  });

  test("float-1", () => {
    const toml = `
flt8 = 224_617.445_991_228
`;
    expect(parseTOML(toml)).toEqual({
      flt8: 224617.445991228,
    });
  });

  test("float-2", () => {
    const toml = `
# infinity
sf1 = inf  # positive infinity
sf2 = +inf # positive infinity
sf3 = -inf # negative infinity

# not a number
sf4 = nan  # actual sNaN/qNaN encoding is implementation-specific
sf5 = +nan # same as \`nan\`
sf6 = -nan # valid, actual encoding is implementation-specific
`;
    expect(parseTOML(toml)).toEqual({
      sf1: Infinity,
      sf2: Infinity,
      sf3: -Infinity,
      sf4: NaN,
      sf5: NaN,
      sf6: NaN,
    });
  });

  test("inline-table-0", () => {
    const toml = `
name = { first = "Tom", last = "Preston-Werner" }
point = { x = 1, y = 2 }
animal = { type.name = "pug" }
`;
    expect(parseTOML(toml)).toEqual({
      animal: {
        type: {
          name: "pug",
        },
      },
      name: {
        first: "Tom",
        last: "Preston-Werner",
      },
      point: {
        x: 1,
        y: 2,
      },
    });
  });

  test("inline-table-1", () => {
    const toml = `
[name]
first = "Tom"
last = "Preston-Werner"

[point]
x = 1
y = 2

[animal]
type.name = "pug"
`;
    expect(parseTOML(toml)).toEqual({
      animal: {
        type: {
          name: "pug",
        },
      },
      name: {
        first: "Tom",
        last: "Preston-Werner",
      },
      point: {
        x: 1,
        y: 2,
      },
    });
  });

  test("inline-table-2", () => {
    const toml = `
[product]
type = { name = "Nail" }
# type.edible = false  # INVALID
`;
    expect(parseTOML(toml)).toEqual({
      product: {
        type: {
          name: "Nail",
        },
      },
    });
  });

  test("inline-table-3", () => {
    const toml = `
[product]
type.name = "Nail"
# type = { edible = false }  # INVALID
`;
    expect(parseTOML(toml)).toEqual({
      product: {
        type: {
          name: "Nail",
        },
      },
    });
  });

  test("integer-0", () => {
    const toml = `
int1 = +99
int2 = 42
int3 = 0
int4 = -17
`;
    expect(parseTOML(toml)).toEqual({
      int1: 99,
      int2: 42,
      int3: 0,
      int4: -17,
    });
  });

  test("integer-1", () => {
    const toml = `
int5 = 1_000
int6 = 5_349_221
int7 = 53_49_221  # Indian number system grouping
int8 = 1_2_3_4_5  # VALID but discouraged
`;
    expect(parseTOML(toml)).toEqual({
      int5: 1000,
      int6: 5349221,
      int7: 5349221,
      int8: 12345,
    });
  });

  test("integer-2", () => {
    const toml = `
# hexadecimal with prefix \`0x\`
hex1 = 0xDEADBEEF
hex2 = 0xdeadbeef
hex3 = 0xdead_beef

# octal with prefix \`0o\`
oct1 = 0o01234567
oct2 = 0o755 # useful for Unix file permissions

# binary with prefix \`0b\`
bin1 = 0b11010110
`;
    expect(parseTOML(toml)).toEqual({
      bin1: 214,
      hex1: 3735928559,
      hex2: 3735928559,
      hex3: 3735928559,
      oct1: 342391,
      oct2: 493,
    });
  });

  test("key-value-pair-0", () => {
    const toml = `
key = "value"
`;
    expect(parseTOML(toml)).toEqual({
      key: "value",
    });
  });

  test("keys-0", () => {
    const toml = `
key = "value"
bare_key = "value"
bare-key = "value"
1234 = "value"
`;
    expect(parseTOML(toml)).toEqual({
      "1234": "value",
      "bare-key": "value",
      bare_key: "value",
      key: "value",
    });
  });

  test("keys-1", () => {
    const toml = `
"127.0.0.1" = "value"
"character encoding" = "value"
"ʎǝʞ" = "value"
'key2' = "value"
'quoted "value"' = "value"
`;
    expect(parseTOML(toml)).toEqual({
      "127.0.0.1": "value",
      "character encoding": "value",
      key2: "value",
      'quoted "value"': "value",
      ʎǝʞ: "value",
    });
  });

  test("keys-3", () => {
    const toml = `
name = "Orange"
physical.color = "orange"
physical.shape = "round"
site."google.com" = true
`;
    expect(parseTOML(toml)).toEqual({
      name: "Orange",
      physical: {
        color: "orange",
        shape: "round",
      },
      site: {
        "google.com": true,
      },
    });
  });

  test("keys-4", () => {
    const toml = `
fruit.name = "banana"     # this is best practice
fruit. color = "yellow"    # same as fruit.color
fruit . flavor = "banana"   # same as fruit.flavor
`;
    expect(parseTOML(toml)).toEqual({
      fruit: {
        color: "yellow",
        flavor: "banana",
        name: "banana",
      },
    });
  });

  test("keys-5", () => {
    const toml = `
# VALID BUT DISCOURAGED

apple.type = "fruit"
orange.type = "fruit"

apple.skin = "thin"
orange.skin = "thick"

apple.color = "red"
orange.color = "orange"
`;
    expect(parseTOML(toml)).toEqual({
      apple: {
        color: "red",
        skin: "thin",
        type: "fruit",
      },
      orange: {
        color: "orange",
        skin: "thick",
        type: "fruit",
      },
    });
  });

  test("keys-6", () => {
    const toml = `
# RECOMMENDED

apple.type = "fruit"
apple.skin = "thin"
apple.color = "red"

orange.type = "fruit"
orange.skin = "thick"
orange.color = "orange"
`;
    expect(parseTOML(toml)).toEqual({
      apple: {
        color: "red",
        skin: "thin",
        type: "fruit",
      },
      orange: {
        color: "orange",
        skin: "thick",
        type: "fruit",
      },
    });
  });

  test("keys-7", () => {
    const toml = `
3.14159 = "pi"
`;
    expect(parseTOML(toml)).toEqual({
      "3": {
        "14159": "pi",
      },
    });
  });

  test("local-date-0", () => {
    const toml = `
ld1 = 1979-05-27
`;
    expect(parseTOML(toml)).toEqual({
      ld1: {
        type: "date-local",
        value: "1979-05-27",
      },
    });
  });

  test("local-date-time-0", () => {
    const toml = `
ldt1 = 1979-05-27T07:32:00
ldt2 = 1979-05-27T00:32:00.999999
`;
    expect(parseTOML(toml)).toEqual({
      ldt1: {
        type: "datetime-local",
        value: "1979-05-27T07:32:00",
      },
      ldt2: {
        type: "datetime-local",
        value: "1979-05-27T00:32:00.999999",
      },
    });
  });

  test("local-time-0", () => {
    const toml = `
lt1 = 07:32:00
lt2 = 00:32:00.999999
`;
    expect(parseTOML(toml)).toEqual({
      lt1: {
        type: "time-local",
        value: "07:32:00",
      },
      lt2: {
        type: "time-local",
        value: "00:32:00.999999",
      },
    });
  });

  test("offset-date-time-0", () => {
    const toml = `
odt1 = 1979-05-27T07:32:00Z
odt2 = 1979-05-27T00:32:00-07:00
odt3 = 1979-05-27T00:32:00.999999-07:00
`;
    expect(parseTOML(toml)).toEqual({
      odt1: {
        type: "datetime",
        value: "1979-05-27T07:32:00Z",
      },
      odt2: {
        type: "datetime",
        value: "1979-05-27T00:32:00-07:00",
      },
      odt3: {
        type: "datetime",
        value: "1979-05-27T00:32:00.999999-07:00",
      },
    });
  });

  test("offset-date-time-1", () => {
    const toml = `
odt4 = 1979-05-27 07:32:00Z
`;
    expect(parseTOML(toml)).toEqual({
      odt4: {
        type: "datetime",
        value: "1979-05-27T07:32:00Z",
      },
    });
  });

  test("string-0", () => {
    const toml = `
str = "I'm a string. \\"You can quote me\\". Name\\tJos\\u00E9\\nLocation\\tSF."
`;
    expect(parseTOML(toml)).toEqual({
      str: 'I\'m a string. "You can quote me". Name\tJosé\nLocation\tSF.',
    });
  });

  test("string-1", () => {
    const toml = `
str1 = """
Roses are red
Violets are blue"""
`;
    expect(parseTOML(toml)).toEqual({
      str1: "Roses are red\nViolets are blue",
    });
  });

  test("string-2", () => {
    const toml = `
# On a Unix system, the above multi-line string will most likely be the same as:
str2 = "Roses are red\\nViolets are blue"

# On a Windows system, it will most likely be equivalent to:
str3 = "Roses are red\\r\\nViolets are blue"
`;
    expect(parseTOML(toml)).toEqual({
      str2: "Roses are red\nViolets are blue",
      str3: "Roses are red\r\nViolets are blue",
    });
  });

  test("string-3", () => {
    const toml = `
# The following strings are byte-for-byte equivalent:
str1 = "The quick brown fox jumps over the lazy dog."

str2 = """
The quick brown \\


  fox jumps over \\
    the lazy dog."""

str3 = """\\
       The quick brown \\
       fox jumps over \\
       the lazy dog.\\
       """
`;
    expect(parseTOML(toml)).toEqual({
      str1: "The quick brown fox jumps over the lazy dog.",
      str2: "The quick brown fox jumps over the lazy dog.",
      str3: "The quick brown fox jumps over the lazy dog.",
    });
  });

  test("string-4", () => {
    const toml = `
str4 = """Here are two quotation marks: "". Simple enough."""
# str5 = """Here are three quotation marks: """."""  # INVALID
str5 = """Here are three quotation marks: ""\\"."""
str6 = """Here are fifteen quotation marks: ""\\"""\\"""\\"""\\"""\\"."""

# "This," she said, "is just a pointless statement."
str7 = """"This," she said, "is just a pointless statement.""""
`;
    expect(parseTOML(toml)).toEqual({
      str4: 'Here are two quotation marks: "". Simple enough.',
      str5: 'Here are three quotation marks: """.',
      str6: 'Here are fifteen quotation marks: """"""""""""""".',
      str7: '"This," she said, "is just a pointless statement."',
    });
  });

  test("string-5", () => {
    const toml = `
# What you see is what you get.
winpath  = 'C:\\Users\\nodejs\\templates'
winpath2 = '\\\\ServerX\\admin$\\system32\\'
quoted   = 'Tom "Dubs" Preston-Werner'
regex    = '<\\i\\c*\\s*>'
`;
    expect(parseTOML(toml)).toEqual({
      quoted: 'Tom "Dubs" Preston-Werner',
      regex: "<\\i\\c*\\s*>",
      winpath: "C:\\Users\\nodejs\\templates",
      winpath2: "\\\\ServerX\\admin$\\system32\\",
    });
  });

  test("string-6", () => {
    const toml = `
regex2 = '''I [dw]on't need \\d{2} apples'''
lines  = '''
The first newline is
trimmed in raw strings.
   All other whitespace
   is preserved.
'''
`;
    expect(parseTOML(toml)).toEqual({
      lines:
        "The first newline is\ntrimmed in raw strings.\n   All other whitespace\n   is preserved.\n",
      regex2: "I [dw]on't need \\d{2} apples",
    });
  });

  test("string-7", () => {
    const toml = `
quot15 = '''Here are fifteen quotation marks: """""""""""""""'''

# apos15 = '''Here are fifteen apostrophes: ''''''''''''''''''  # INVALID
apos15 = "Here are fifteen apostrophes: '''''''''''''''"

# 'That,' she said, 'is still pointless.'
str = ''''That,' she said, 'is still pointless.''''
`;
    expect(parseTOML(toml)).toEqual({
      apos15: "Here are fifteen apostrophes: '''''''''''''''",
      quot15: 'Here are fifteen quotation marks: """""""""""""""',
      str: "'That,' she said, 'is still pointless.'",
    });
  });

  test("table-0", () => {
    const toml = `
[table]
`;
    expect(parseTOML(toml)).toEqual({
      table: {},
    });
  });

  test("table-1", () => {
    const toml = `
[table-1]
key1 = "some string"
key2 = 123

[table-2]
key1 = "another string"
key2 = 456
`;
    expect(parseTOML(toml)).toEqual({
      "table-1": {
        key1: "some string",
        key2: 123,
      },
      "table-2": {
        key1: "another string",
        key2: 456,
      },
    });
  });

  test("table-2", () => {
    const toml = `
[dog."tater.man"]
type.name = "pug"
`;
    expect(parseTOML(toml)).toEqual({
      dog: {
        "tater.man": {
          type: {
            name: "pug",
          },
        },
      },
    });
  });

  test("table-3", () => {
    const toml = `
[a.b.c]            # this is best practice
[ d.e.f ]          # same as [d.e.f]
[ g .  h  . i ]    # same as [g.h.i]
[ j . "ʞ" . 'l' ]  # same as [j."ʞ".'l']
`;
    expect(parseTOML(toml)).toEqual({
      a: {
        b: {
          c: {},
        },
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
    });
  });

  test("table-4", () => {
    const toml = `
# [x] you
# [x.y] don't
# [x.y.z] need these
[x.y.z.w] # for this to work

[x] # defining a super-table afterward is ok
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

  test("table-5", () => {
    const toml = `
# VALID BUT DISCOURAGED
[fruit.apple]
[animal]
[fruit.orange]
`;
    expect(parseTOML(toml)).toEqual({
      animal: {},
      fruit: {
        apple: {},
        orange: {},
      },
    });
  });

  test("table-6", () => {
    const toml = `
# RECOMMENDED
[fruit.apple]
[fruit.orange]
[animal]
`;
    expect(parseTOML(toml)).toEqual({
      animal: {},
      fruit: {
        apple: {},
        orange: {},
      },
    });
  });

  test("table-7", () => {
    const toml = `
# Top-level table begins.
name = "Fido"
breed = "pug"

# Top-level table ends.
[owner]
name = "Regina Dogman"
member_since = 1999-08-04
`;
    expect(parseTOML(toml)).toEqual({
      breed: "pug",
      name: "Fido",
      owner: {
        member_since: {
          type: "date-local",
          value: "1999-08-04",
        },
        name: "Regina Dogman",
      },
    });
  });

  test("table-8", () => {
    const toml = `
fruit.apple.color = "red"
# Defines a table named fruit
# Defines a table named fruit.apple

fruit.apple.taste.sweet = true
# Defines a table named fruit.apple.taste
# fruit and fruit.apple were already created
`;
    expect(parseTOML(toml)).toEqual({
      fruit: {
        apple: {
          color: "red",
          taste: {
            sweet: true,
          },
        },
      },
    });
  });

  test("table-9", () => {
    const toml = `
[fruit]
apple.color = "red"
apple.taste.sweet = true

# [fruit.apple]  # INVALID
# [fruit.apple.taste]  # INVALID

[fruit.apple.texture]  # you can add sub-tables
smooth = true
`;
    expect(parseTOML(toml)).toEqual({
      fruit: {
        apple: {
          color: "red",
          taste: {
            sweet: true,
          },
          texture: {
            smooth: true,
          },
        },
      },
    });
  });
});

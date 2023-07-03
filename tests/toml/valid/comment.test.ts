import { expect, test, describe } from "vitest";
import { parseTOML } from "../index";
describe("comment", () => {
  test("at-eof", () => {
    const toml = `
# This is a full-line comment
key = "value" # This is a comment at the end of a line
`;
    expect(parseTOML(toml)).toEqual({
      key: "value",
    });
  });

  test("at-eof2", () => {
    const toml = `
# This is a full-line comment
key = "value" # This is a comment at the end of a line
`;
    expect(parseTOML(toml)).toEqual({
      key: "value",
    });
  });

  test("everywhere", () => {
    const toml = `
# Top comment.
  # Top comment.
# Top comment.

# [no-extraneous-groups-please]

[group] # Comment
answer = 42 # Comment
# no-extraneous-keys-please = 999
# Inbetween comment.
more = [ # Comment
  # What about multiple # comments?
  # Can you handle it?
  #
          # Evil.
# Evil.
  42, 42, # Comments within arrays are fun.
  # What about multiple # comments?
  # Can you handle it?
  #
          # Evil.
# Evil.
# ] Did I fool you?
] # Hopefully not.

# Make sure the space between the datetime and "#" isn't lexed.
dt = 1979-05-27T07:32:12-07:00  # c
d = 1979-05-27 # Comment
`;
    expect(parseTOML(toml)).toEqual({
      group: {
        answer: 42,
        dt: {
          type: "datetime",
          value: "1979-05-27T07:32:12-07:00",
        },
        d: {
          type: "date-local",
          value: "1979-05-27",
        },
        more: [42, 42],
      },
    });
  });

  test("noeol", () => {
    const toml = `
# single comment without any eol characters`;
    expect(parseTOML(toml)).toEqual({});
  });

  test("nonascii", () => {
    const toml = `
# ~  ÿ ퟿  ￿ 𐀀 􏿿
`;
    expect(parseTOML(toml)).toEqual({});
  });

  test("tricky", () => {
    const toml = `
[section]#attached comment
#[notsection]
one = "11"#cmt
two = "22#"
three = '#'

four = """# no comment
# nor this
#also not comment"""#is_comment

five = 5.5#66
six = 6#7
8 = "eight"
#nine = 99
ten = 10e2#1
eleven = 1.11e1#23

["hash#tag"]
"#!" = "hash bang"
arr3 = [ "#", '#', """###""" ]
arr4 = [ 1,# 9, 9,
2#,9
,#9
3#]
,4]
arr5 = [[[[#["#"],
["#"]]]]#]
]
tbl1 = { "#" = '}#'}#}}


`;
    expect(parseTOML(toml)).toEqual({
      "hash#tag": {
        "#!": "hash bang",
        arr3: ["#", "#", "###"],
        arr4: [1, 2, 3, 4],
        arr5: [[[[["#"]]]]],
        tbl1: {
          "#": "}#",
        },
      },
      section: {
        "8": "eight",
        eleven: 11.1,
        five: 5.5,
        four: "# no comment\n# nor this\n#also not comment",
        one: "11",
        six: 6,
        ten: 1000,
        three: "#",
        two: "22#",
      },
    });
  });
});

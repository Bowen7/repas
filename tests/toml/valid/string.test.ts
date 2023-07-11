import { expect, test, describe } from "vitest";
import { parseTOML } from "../index";
describe("string", () => {
  test("double-quote-escape", () => {
    const toml = `
test = "\\"one\\""
`;
    expect(parseTOML(toml)).toEqual({
      test: '"one"',
    });
  });

  test("empty", () => {
    const toml = `
answer = ""
`;
    expect(parseTOML(toml)).toEqual({
      answer: "",
    });
  });

  test("escape-esc", () => {
    const toml = `
esc = "\\e There is no escape! \\e"
`;
    expect(parseTOML(toml)).toEqual({
      esc: "\u001b There is no escape! \u001b",
    });
  });

  test("escape-tricky", () => {
    const toml = `
end_esc = "String does not end here\\" but ends here\\\\"
lit_end_esc = 'String ends here\\'

multiline_unicode = """
\\u00a0"""

multiline_not_unicode = """
\\\\u0041"""

multiline_end_esc = """When will it end? \\"""...""\\" should be here\\""""

lit_multiline_not_unicode = '''
\\u007f'''

lit_multiline_end = '''There is no escape\\'''
`;
    expect(parseTOML(toml)).toEqual({
      end_esc: 'String does not end here" but ends here\\',
      lit_end_esc: "String ends here\\",
      lit_multiline_end: "There is no escape\\",
      lit_multiline_not_unicode: "\\u007f",
      multiline_end_esc: 'When will it end? """...""" should be here"',
      multiline_not_unicode: "\\u0041",
      multiline_unicode: " ",
    });
  });

  test("escaped-escape", () => {
    const toml = `
answer = "\\\\x64"
`;
    expect(parseTOML(toml)).toEqual({
      answer: "\\x64",
    });
  });

  test("escapes", () => {
    const toml = `
backspace = "This string has a \\b backspace character."
tab = "This string has a \\t tab character."
newline = "This string has a \\n new line character."
formfeed = "This string has a \\f form feed character."
carriage = "This string has a \\r carriage return character."
quote = "This string has a \\" quote character."
backslash = "This string has a \\\\ backslash character."
notunicode1 = "This string does not have a unicode \\\\u escape."
notunicode2 = "This string does not have a unicode \\u005Cu escape."
notunicode3 = "This string does not have a unicode \\\\u0075 escape."
notunicode4 = "This string does not have a unicode \\\\\\u0075 escape."
delete = "This string has a \\u007F delete control code."
unitseparator = "This string has a \\u001F unit separator control code."
`;
    expect(parseTOML(toml)).toEqual({
      backslash: "This string has a \\ backslash character.",
      backspace: "This string has a \b backspace character.",
      carriage: "This string has a \r carriage return character.",
      delete: "This string has a  delete control code.",
      formfeed: "This string has a \f form feed character.",
      newline: "This string has a \n new line character.",
      notunicode1: "This string does not have a unicode \\u escape.",
      notunicode2: "This string does not have a unicode \\u escape.",
      notunicode3: "This string does not have a unicode \\u0075 escape.",
      notunicode4: "This string does not have a unicode \\u escape.",
      quote: 'This string has a " quote character.',
      tab: "This string has a \t tab character.",
      unitseparator: "This string has a \u001f unit separator control code.",
    });
  });

  test("hex-escape", () => {
    const toml = `
# \\\\x for the first 255 codepoints

whitespace      = "\\x20 \\x09 \\x1b \\x0d\\x0a"
bs              = "\\x7f"
nul             = "\\x00"
hello           = "\\x68\\x65\\x6c\\x6c\\x6f\\x0a"
higher-than-127 = "S\\xf8rmirb\\xe6ren"

multiline = """
\\x20 \\x09 \\x1b \\x0d\\x0a
\\x7f
\\x00
\\x68\\x65\\x6c\\x6c\\x6f\\x0a
\\x53\\xF8\\x72\\x6D\\x69\\x72\\x62\\xE6\\x72\\x65\\x6E
"""

# Not inside literals.
literal = '\\x20 \\x09 \\x0d\\x0a'
multiline-literal = '''
\\x20 \\x09 \\x0d\\x0a
'''
`;
    expect(parseTOML(toml)).toEqual({
      bs: "",
      hello: "hello\n",
      "higher-than-127": "Sørmirbæren",
      literal: "\\x20 \\x09 \\x0d\\x0a",
      multiline: "  \t \u001b \r\n\n\n\u0000\nhello\n\nSørmirbæren\n",
      "multiline-literal": "\\x20 \\x09 \\x0d\\x0a\n",
      nul: "\u0000",
      whitespace: "  \t \u001b \r\n",
    });
  });

  test("multiline-escaped-crlf", () => {
    const toml = `
# The following line should be an unescaped backslash followed by a Windows
# newline sequence ("\\r\\n")
0="""\\
"""
`;
    expect(parseTOML(toml)).toEqual({
      "0": "",
    });
  });

  test("multiline-quotes", () => {
    const toml = `
# Make sure that quotes inside multiline strings are allowed, including right
# after the opening '''/""" and before the closing '''/"""

lit_one = ''''one quote''''
lit_two = '''''two quotes'''''
lit_one_space = ''' 'one quote' '''
lit_two_space = ''' ''two quotes'' '''

one = """"one quote""""
two = """""two quotes"""""
one_space = """ "one quote" """
two_space = """ ""two quotes"" """

mismatch1 = """aaa'''bbb"""
mismatch2 = '''aaa"""bbb'''

# Three opening """, then one escaped ", then two "" (allowed), and then three
# closing """
escaped = """lol\\""""""
`;
    expect(parseTOML(toml)).toEqual({
      escaped: 'lol"""',
      lit_one: "'one quote'",
      lit_one_space: " 'one quote' ",
      lit_two: "''two quotes''",
      lit_two_space: " ''two quotes'' ",
      mismatch1: "aaa'''bbb",
      mismatch2: 'aaa"""bbb',
      one: '"one quote"',
      one_space: ' "one quote" ',
      two: '""two quotes""',
      two_space: ' ""two quotes"" ',
    });
  });

  test("multiline", () => {
    const toml = `
# NOTE: this file includes some literal tab characters.

multiline_empty_one = """"""

# A newline immediately following the opening delimiter will be trimmed.
multiline_empty_two = """
"""

# \\ at the end of line trims newlines as well; note that last \\ is followed by
# two spaces, which are ignored.
multiline_empty_three = """\\
    """
multiline_empty_four = """\\
   \\
   \\  
   """

equivalent_one = "The quick brown fox jumps over the lazy dog."
equivalent_two = """
The quick brown \\


  fox jumps over \\
    the lazy dog."""

equivalent_three = """\\
       The quick brown \\
       fox jumps over \\
       the lazy dog.\\
       """

whitespace-after-bs = """\\
       The quick brown \\
       fox jumps over \\   
       the lazy dog.\\	
       """

no-space = """a\\
    b"""

# Has tab character.
keep-ws-before = """a   	\\
   b"""

escape-bs-1 = """a \\\\
b"""

escape-bs-2 = """a \\\\\\
b"""

escape-bs-3 = """a \\\\\\\\
  b"""
`;
    expect(parseTOML(toml)).toEqual({
      equivalent_one: "The quick brown fox jumps over the lazy dog.",
      equivalent_three: "The quick brown fox jumps over the lazy dog.",
      equivalent_two: "The quick brown fox jumps over the lazy dog.",
      "escape-bs-1": "a \\\nb",
      "escape-bs-2": "a \\b",
      "escape-bs-3": "a \\\\\n  b",
      "keep-ws-before": "a   \tb",
      multiline_empty_four: "",
      multiline_empty_one: "",
      multiline_empty_three: "",
      multiline_empty_two: "",
      "no-space": "ab",
      "whitespace-after-bs": "The quick brown fox jumps over the lazy dog.",
    });
  });

  test("nl", () => {
    const toml = `
nl_mid = "val\\nue"
nl_end = """value\\n"""

lit_nl_end = '''value\\n'''
lit_nl_mid = 'val\\nue'
lit_nl_uni = 'val\\ue'
`;
    expect(parseTOML(toml)).toEqual({
      lit_nl_end: "value\\n",
      lit_nl_mid: "val\\nue",
      lit_nl_uni: "val\\ue",
      nl_end: "value\n",
      nl_mid: "val\nue",
    });
  });

  test("quoted-unicode", () => {
    const toml = `

escaped_string = "\\u0000 \\u0008 \\u000c \\U00000041 \\u007f \\u0080 \\u00ff \\ud7ff \\ue000 \\uffff \\U00010000 \\U0010ffff"
not_escaped_string = '\\u0000 \\u0008 \\u000c \\U00000041 \\u007f \\u0080 \\u00ff \\ud7ff \\ue000 \\uffff \\U00010000 \\U0010ffff'

basic_string = "~  ÿ ퟿  ￿ 𐀀 􏿿"
literal_string = '~  ÿ ퟿  ￿ 𐀀 􏿿'
`;
    expect(parseTOML(toml)).toEqual({
      escaped_string: "\u0000 \b \f A   ÿ ퟿  ￿ 𐀀 􏿿",
      not_escaped_string:
        "\\u0000 \\u0008 \\u000c \\U00000041 \\u007f \\u0080 \\u00ff \\ud7ff \\ue000 \\uffff \\U00010000 \\U0010ffff",
      basic_string: "~  ÿ ퟿  ￿ 𐀀 􏿿",
      literal_string: "~  ÿ ퟿  ￿ 𐀀 􏿿",
    });
  });

  test("raw-multiline", () => {
    const toml = `
# Single ' should be allowed.
oneline = '''This string has a ' quote character.'''

# A newline immediately following the opening delimiter will be trimmed.
firstnl = '''
This string has a ' quote character.'''

# All other whitespace and newline characters remain intact.
multiline = '''
This string
has ' a quote character
and more than
one newline
in it.'''

# Tab character in literal string does not need to be escaped
multiline_with_tab = '''First line
	 Followed by a tab'''
`;
    expect(parseTOML(toml)).toEqual({
      firstnl: "This string has a ' quote character.",
      multiline:
        "This string\nhas ' a quote character\nand more than\none newline\nin it.",
      oneline: "This string has a ' quote character.",
      multiline_with_tab: "First line\n\t Followed by a tab",
    });
  });

  test("raw", () => {
    const toml = `
backspace = 'This string has a \\b backspace character.'
tab = 'This string has a \\t tab character.'
unescaped_tab = 'This string has an 	 unescaped tab character.'
newline = 'This string has a \\n new line character.'
formfeed = 'This string has a \\f form feed character.'
carriage = 'This string has a \\r carriage return character.'
slash = 'This string has a \\/ slash character.'
backslash = 'This string has a \\\\ backslash character.'
`;
    expect(parseTOML(toml)).toEqual({
      backslash: "This string has a \\\\ backslash character.",
      backspace: "This string has a \\b backspace character.",
      carriage: "This string has a \\r carriage return character.",
      formfeed: "This string has a \\f form feed character.",
      newline: "This string has a \\n new line character.",
      slash: "This string has a \\/ slash character.",
      tab: "This string has a \\t tab character.",
      unescaped_tab: "This string has an \t unescaped tab character.",
    });
  });

  test("simple", () => {
    const toml = `
answer = "You are not drinking enough whisky."
`;
    expect(parseTOML(toml)).toEqual({
      answer: "You are not drinking enough whisky.",
    });
  });

  test("unicode-escape", () => {
    const toml = `
answer4 = "\\u03B4"
answer8 = "\\U000003B4"
`;
    expect(parseTOML(toml)).toEqual({
      answer4: "δ",
      answer8: "δ",
    });
  });

  test("unicode-literal", () => {
    const toml = `
answer = "δ"
`;
    expect(parseTOML(toml)).toEqual({
      answer: "δ",
    });
  });

  test("with-pound", () => {
    const toml = `
pound = "We see no # comments here."
poundcomment = "But there are # some comments here." # Did I # mess you up?
`;
    expect(parseTOML(toml)).toEqual({
      pound: "We see no # comments here.",
      poundcomment: "But there are # some comments here.",
    });
  });
});

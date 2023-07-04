import { expect, test, describe } from "vitest";
import { parseTOML } from "../index";
describe("integer", () => {
  test("integer", () => {
    const toml = `
answer = 42
posanswer = +42
neganswer = -42
zero = 0
`;
    expect(parseTOML(toml)).toEqual({
      answer: 42,
      neganswer: -42,
      posanswer: 42,
      zero: 0,
    });
  });

  test("literals", () => {
    const toml = `
bin1 = 0b11010110
bin2 = 0b1_0_1

oct1 = 0o01234567
oct2 = 0o755
oct3 = 0o7_6_5

hex1 = 0xDEADBEEF
hex2 = 0xdeadbeef
hex3 = 0xdead_beef
hex4 = 0x00987
`;
    expect(parseTOML(toml)).toEqual({
      bin1: 214,
      bin2: 5,
      hex1: 3735928559,
      hex2: 3735928559,
      hex3: 3735928559,
      hex4: 2439,
      oct1: 342391,
      oct2: 493,
      oct3: 501,
    });
  });

  test("long", () => {
    const toml = `
int64-max = 9223372036854775807
int64-max-neg = -9223372036854775808
`;
    expect(parseTOML(toml)).toEqual({
      "int64-max": BigInt("9223372036854775807"),
      "int64-max-neg": BigInt("-9223372036854775808"),
    });
  });

  test("underscore", () => {
    const toml = `
kilo = 1_000
x = 1_1_1_1
`;
    expect(parseTOML(toml)).toEqual({
      kilo: 1000,
      x: 1111,
    });
  });

  test("zero", () => {
    const toml = `
d1 = 0
d2 = +0
d3 = -0

h1 = 0x0
h2 = 0x00
h3 = 0x00000

o1 = 0o0
a2 = 0o00
a3 = 0o00000

b1 = 0b0
b2 = 0b00
b3 = 0b00000
`;
    expect(parseTOML(toml)).toEqual({
      a2: 0,
      a3: 0,
      b1: 0,
      b2: 0,
      b3: 0,
      d1: 0,
      d2: 0,
      d3: 0,
      h1: 0,
      h2: 0,
      h3: 0,
      o1: 0,
    });
  });
});

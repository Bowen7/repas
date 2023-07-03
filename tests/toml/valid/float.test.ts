import { expect, test, describe } from "vitest";
import { parseTOML } from "../index";
describe("float", () => {
  test("exponent", () => {
    const toml = `
lower = 3e2
upper = 3E2
neg = 3e-2
pos = 3E+2
zero = 3e0
pointlower = 3.1e2
pointupper = 3.1E2
minustenth = -1E-1
`;
    expect(parseTOML(toml)).toEqual({
      lower: 300,
      minustenth: -0.1,
      neg: 0.03,
      pointlower: 310,
      pointupper: 310,
      pos: 300,
      upper: 300,
      zero: 3,
    });
  });

  test("float", () => {
    const toml = `
pi = 3.14
pospi = +3.14
negpi = -3.14
zero-intpart = 0.123
`;
    expect(parseTOML(toml)).toEqual({
      negpi: -3.14,
      pi: 3.14,
      pospi: 3.14,
      "zero-intpart": 0.123,
    });
  });

  test("inf-and-nan", () => {
    const toml = `
# We don't encode +nan and -nan back with the signs; many languages don't
# support a sign on NaN (it doesn't really make much sense).
nan = nan
nan_neg = -nan
nan_plus = +nan
infinity = inf
infinity_neg = -inf
infinity_plus = +inf
`;
    expect(parseTOML(toml)).toEqual({
      infinity: Infinity,
      infinity_neg: -Infinity,
      infinity_plus: Infinity,
      nan: NaN,
      nan_neg: NaN,
      nan_plus: NaN,
    });
  });

  test("long", () => {
    const toml = `
longpi = 3.141592653589793
neglongpi = -3.141592653589793
`;
    expect(parseTOML(toml)).toEqual({
      longpi: 3.141592653589793,
      neglongpi: -3.141592653589793,
    });
  });

  test("underscore", () => {
    const toml = `
before = 3_141.5927
after = 3141.592_7
exponent = 3e1_4
`;
    expect(parseTOML(toml)).toEqual({
      after: 3141.5927,
      before: 3141.5927,
      exponent: 300000000000000,
    });
  });

  test("zero", () => {
    const toml = `
zero = 0.0
signed-pos = +0.0
signed-neg = -0.0
exponent = 0e0
exponent-two-0 = 0e00
exponent-signed-pos = +0e0
exponent-signed-neg = -0e0
`;
    expect(parseTOML(toml)).toEqual({
      zero: 0,
      "signed-pos": 0,
      "signed-neg": 0,
      exponent: 0,
      "exponent-two-0": 0,
      "exponent-signed-pos": 0,
      "exponent-signed-neg": 0,
    });
  });
});

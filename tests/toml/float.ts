import { opt, alt, take1, more0, isDigit, map, value, pair, either } from "src";
import { underscore, plus, minus, e, decimalPoint, inf, nan } from "./tag";
import { signedDecInt } from "./integer";
import { stringArrayToString } from "./utils";

const floatIntPart = signedDecInt;
const zeroPrefixableInt = pair(
  take1(isDigit),
  more0(alt([take1(isDigit), pair(value(underscore, ""), take1(isDigit))]))
);
const floatExpPart = pair(opt(either(plus, minus)), zeroPrefixableInt);
const exp = pair(e, floatExpPart);
const frac = pair(decimalPoint, zeroPrefixableInt);

const floatMap = {
  inf: Infinity,
  "+inf": Infinity,
  "-inf": -Infinity,
  nan: NaN,
  "+nan": NaN,
  "-nan": NaN,
};
const specialFloat = map(
  pair(opt(either(plus, minus)), either(inf, nan)),
  (value): number => {
    const str = stringArrayToString(value);
    return floatMap[str as keyof typeof floatMap];
  }
);

export const float = either(
  specialFloat,
  map(
    pair(floatIntPart, either(exp, pair(frac, opt(exp)))),
    (value) => parseFloat(stringArrayToString(value)) || 0
  )
);

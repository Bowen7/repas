import {
  opt,
  alt,
  isHexDigit,
  take1,
  more0,
  isDigit19,
  isDigit,
  map,
  value,
  pair,
  either,
  fatal,
  peek,
  terminated,
} from "src";
import { isDigit07, isDigit01 } from "./char";
import {
  underscore,
  plus,
  minus,
  hexPrefix,
  octPrefix,
  binPrefix,
  e,
  decimalPoint,
  inf,
  nan,
} from "./tag";
import { stringArrayToString } from "./utils";

const unsignedDecInt = either(
  pair(
    take1(isDigit19),
    more0(either(take1(isDigit), pair(value(underscore, ""), take1(isDigit))))
  ),
  take1(isDigit)
);

export const signedDecInt = pair(opt(either(plus, minus)), unsignedDecInt);

const decInt = map(signedDecInt, (value) => {
  const str = stringArrayToString(value);
  const num = parseInt(stringArrayToString(value), 10);
  if (num > Number.MAX_SAFE_INTEGER || num < Number.MIN_SAFE_INTEGER) {
    return BigInt(str);
  }
  return num;
});

const hexInt = map(
  pair(
    hexPrefix,
    fatal(
      pair(
        take1(isHexDigit),
        more0(
          either(
            take1(isHexDigit),
            pair(value(underscore, ""), take1(isHexDigit))
          )
        )
      ),
      "unexpected hexadecimal integer format"
    )
  ),
  (value) => parseInt(stringArrayToString(value), 16)
);

const octInt = map(
  pair(
    value(octPrefix, ""),
    fatal(
      pair(
        take1(isDigit07),
        more0(
          either(
            take1(isDigit07),
            pair(value(underscore, ""), take1(isDigit07))
          )
        )
      ),
      "unexpected hexadecimal octal format"
    )
  ),
  (value) => parseInt(stringArrayToString(value), 8)
);

const binInt = map(
  pair(
    value(binPrefix, ""),
    fatal(
      pair(
        take1(isDigit01),
        more0(
          either(
            take1(isDigit01),
            pair(value(underscore, ""), take1(isDigit01))
          )
        )
      ),
      "unexpected hexadecimal binary format"
    )
  ),
  (value) => parseInt(stringArrayToString(value), 2)
);

const integer = map(
  alt([hexInt, octInt, binInt, decInt]),
  (value) => value || 0
);

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

const float = either(
  specialFloat,
  map(
    pair(floatIntPart, either(exp, pair(frac, opt(exp)))),
    (value) => parseFloat(stringArrayToString(value)) || 0
  )
);

export const number = terminated(
  peek(alt([plus, minus, take1(isDigit), nan, inf])),
  fatal(either(float, integer), "unexpected number format")
);

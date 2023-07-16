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
} from "src";
import { isDigit07, isDigit01 } from "./char";
import {
  underscore,
  plus,
  minus,
  hexPrefix,
  octPrefix,
  binPrefix,
} from "./tag";
import { stringArrayToString, unexpected } from "./utils";

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
      unexpected("hexadecimal integer")
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
      unexpected("octal integer")
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
      unexpected("binary integer")
    )
  ),
  (value) => parseInt(stringArrayToString(value), 2)
);

export const integer = map(
  alt([hexInt, octInt, binInt, decInt]),
  (value) => value || 0
);

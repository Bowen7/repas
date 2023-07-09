import { displayErrRes } from "./../../src/utils";
import {
  Parser,
  tuple,
  tag,
  opt,
  newline,
  alt,
  space0,
  delimited,
  isSpace,
  isHexDigit,
  take1,
  more0,
  more1,
  isDigit19,
  isDigit,
  takeX,
  space,
  repeat,
  map,
  value,
  mapRes,
  pair,
  triplet,
  either,
  Result,
  fail,
  peek,
  preceded,
  terminated,
  separatedPair,
  oneOf,
  debug,
} from "src";
import {
  isAllowedCommentChar,
  isUnquotedKeyChar,
  isLiteralChar,
  isDigit07,
  isDigit01,
  basicChar,
  literalChar,
} from "./char";
import { DateTime, TOMLArray, TOMLValue, TOMLTable } from "./types";

let rootValue: TOMLTable = {};
let currentValue: TOMLTable = rootValue;

const getTableValue = (
  table: TOMLTable,
  paths: string[],
  isArrayTable = false
): Result<{ value: TOMLArray | TOMLTable }, {}> => {
  const len = paths.length;
  let cur: TOMLTable | TOMLArray = table;
  let i = 0;
  while (i < len) {
    if (Object.isFrozen(cur)) {
      return { ok: false };
    }
    if (Array.isArray(cur)) {
      cur = cur[cur.length - 1] as TOMLTable | TOMLArray;
      continue;
    }
    const path = paths[i];
    if (path in cur) {
      cur = cur[path] as TOMLTable | TOMLArray;
      if (i === len - 1 && isArrayTable && !Array.isArray(cur)) {
        return { ok: false };
      }
    } else {
      if (i === len - 1 && isArrayTable) {
        cur[path] = [];
      } else {
        cur[path] = {};
      }
      cur = cur[path] as TOMLTable;
    }
    i++;
  }
  if (Object.isFrozen(cur)) {
    return { ok: false };
  }
  return { ok: true, value: cur };
};

const questionMark = tag('"');
const apostrophe = tag("'");
const minus = tag("-");
const plus = tag("+");
const underscore = tag("_");
const hexPrefix = tag("0x");
const octPrefix = tag("0o");
const binPrefix = tag("0b");
const e = oneOf("eE");
const inf = tag("inf");
const nan = tag("nan");
const decimalPoint = tag(".");
const colon = tag(":");
const hyphen = tag("-");
const arrayOpen = tag("[");
const arrayClose = tag("]");
const comma = tag(",");
const inlineTableOpen = tag("{");
const inlineTableClose = tag("}");
const equal = tag("=");
const stdTableOpen = pair(tag("["), space0);
const stdTableClose = pair(space0, tag("]"));
const arrayTableOpen = pair(tag("[["), space0);
const arrayTableClose = pair(space0, tag("]]"));
const mlBasicStringDelim = tag('"""');
const escape = tag("\\");
const mlLiteralStringDelim = tag("'''");

type StringArray = (StringArray | string)[];
const stringArrayToString = (array: StringArray): string =>
  array
    .map((item) => (Array.isArray(item) ? stringArrayToString(item) : item))
    .join("");

// Basic string
const basicString = map(
  delimited(questionMark, more0(basicChar), questionMark),
  (chars) => chars.join("")
);

// Comment
const comment = pair(tag("#"), more0(isAllowedCommentChar));
const wsCommentNewline = more0(
  either(more1(isSpace), pair(opt(comment), newline))
);

// Literal string
const literalString = delimited(apostrophe, more0(isLiteralChar), apostrophe);

// Quoted and dotted key
const unquotedKey = more1(isUnquotedKeyChar);
const quotedKey = either(basicString, literalString);

const simpleKey = either(quotedKey, unquotedKey);

const dotSep = map(tuple([space0, tag("."), space0]), (value) => value[1]);

// Multiline Basic String
const mlbEscapedNl = map(
  tuple([escape, space0, newline, more0(either(space, newline))]),
  () => ""
);
const mlbContent = alt([basicChar, newline, mlbEscapedNl]);
const mlbQuotes = repeat(questionMark, 1, 2);

const mlBasicBody = map(
  pair(more0(mlbContent), more0(pair(mlbQuotes, more1(mlbContent)))),
  (value) => stringArrayToString(value)
);
const mlBasicStringCloseDelim = map(
  repeat((char: string) => char === '"', 3, 5),
  (value: string) => value.slice(3)
);
const mlBasicString = map(
  tuple([
    mlBasicStringDelim,
    opt(newline),
    mlBasicBody,
    mlBasicStringCloseDelim,
  ]),
  ([, , body, closeDelim]) => body + closeDelim
);

// Multiline Literal String
const mllQuotes = repeat(apostrophe, 1, 2);
const mllContent = either(literalChar, newline);
const mllLiteralBody = map(
  pair(more0(mllContent), opt(pair(mllQuotes, more1(mllContent)))),
  (value) => stringArrayToString(value)
);
const mlLiteralStringCloseDelim = map(
  repeat((char: string) => char === "'", 3, 5),
  (value: string) => value.slice(3)
);
const mlLiteralString = map(
  tuple([
    mlLiteralStringDelim,
    opt(newline),
    mllLiteralBody,
    mlLiteralStringCloseDelim,
  ]),
  ([, , body, closeDelim]) => body + closeDelim
);

// String
const string = alt([
  mlBasicString,
  mlLiteralString,
  basicString,
  literalString,
]);

// Key-Value pairs
const keyvalSep = delimited(space0, equal, space0);
const key = map(
  pair(simpleKey, more0(terminated(dotSep, simpleKey))),
  ([value, values]) => [value, ...values]
);
const keyval = separatedPair(key, keyvalSep, val) as Parser<
  [string[], TOMLValue]
>;

// Boolean
const boolean = map(either(tag("true"), tag("false")), (str) => str === "true");

// Integer
const unsignedDecInt = either(
  pair(
    take1(isDigit19),
    more0(either(take1(isDigit), pair(value(underscore, ""), take1(isDigit))))
  ),
  take1(isDigit)
);
const signedDecInt = pair(opt(either(plus, minus)), unsignedDecInt);
const decInt = map(signedDecInt, (value) => {
  const str = stringArrayToString(value);
  const num = parseInt(stringArrayToString(value), 10);
  if (num > Number.MAX_SAFE_INTEGER || num < Number.MIN_SAFE_INTEGER) {
    return BigInt(str);
  }
  return num;
});

const hexInt = debug(
  map(
    triplet(
      hexPrefix,
      take1(isHexDigit),
      more0(
        either(
          take1(isHexDigit),
          pair(value(underscore, ""), take1(isHexDigit))
        )
      )
    ),
    (value) => parseInt(stringArrayToString(value), 16)
  ),
  "hex"
);
const octInt = map(
  triplet(
    value(octPrefix, ""),
    take1(isDigit07),
    more0(
      either(take1(isDigit07), pair(value(underscore, ""), take1(isDigit07)))
    )
  ),
  (value) => parseInt(stringArrayToString(value), 8)
);
const binInt = map(
  triplet(
    value(binPrefix, ""),
    take1(isDigit01),
    more0(
      either(take1(isDigit01), pair(value(underscore, ""), take1(isDigit01)))
    )
  ),
  (value) => parseInt(stringArrayToString(value), 2)
);
const integer = map(alt([hexInt, octInt, binInt, decInt]), (value) =>
  value === 0 ? 0 : value
);

// Float
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
  map(pair(floatIntPart, either(exp, pair(frac, opt(exp)))), (value) =>
    parseFloat(stringArrayToString(value))
  )
);

// Date
const dateFullYear = takeX(isDigit, 4);
const dateMonth = takeX(isDigit, 2);
const dateMDay = takeX(isDigit, 2);
const timeDelim = value(
  take1((char) => char === "t" || char === "T" || isSpace(char)),
  "T"
);
const timeHour = takeX(isDigit, 2);
const timeMinute = takeX(isDigit, 2);
const timeSecond = takeX(isDigit, 2);
const timeSecFrac = pair(
  decimalPoint,
  map(more1(isDigit), (value) =>
    value.length < 3 ? value + "0".repeat(3 - value.length) : value
  )
);
const timeNumOffset = tuple([
  take1((char) => char === "+" || char === "-"),
  timeHour,
  colon,
  timeMinute,
]);
const timeOffset = either(timeNumOffset, value(oneOf("zZ"), "Z"));
const partialTime = tuple([
  timeHour,
  colon,
  timeMinute,
  opt(triplet(colon, timeSecond, opt(timeSecFrac)), ":00"),
]);
const fullDate = tuple([dateFullYear, hyphen, dateMonth, hyphen, dateMDay]);
const fullTime = pair(partialTime, timeOffset);
const fullDateTime = map(tuple([fullDate, timeDelim, fullTime]), (value) => ({
  type: "datetime",
  value: stringArrayToString(value),
}));
const localDateTime = map(
  triplet(fullDate, timeDelim, partialTime),
  (value) => ({
    type: "datetime-local",
    value: stringArrayToString(value),
  })
);
const localDate = map(fullDate, (value) => ({
  type: "date-local",
  value: stringArrayToString(value),
}));
const localTime = map(partialTime, (value) => ({
  type: "time-local",
  value: stringArrayToString(value),
}));
const dateTime = alt([
  fullDateTime,
  localDateTime,
  localDate,
  localTime,
]) as Parser<DateTime>;

// Array
const arrayValue = delimited(wsCommentNewline, val, wsCommentNewline);
const arrayValues = preceded(
  map(
    pair(arrayValue, more0(terminated(comma, arrayValue))),
    ([value, values]) => [value, ...values]
  ),
  opt(comma)
);
const array = map(
  tuple([arrayOpen, opt(arrayValues), wsCommentNewline, arrayClose]),
  (value) => value[1] || []
) as Parser<TOMLArray>;

// Standard Table
const stdTable = mapRes(
  delimited(stdTableOpen, key, stdTableClose),
  (result) => {
    if (result.ok) {
      const paths = result.value;
      const res = getTableValue(rootValue, paths);
      if (res.ok) {
        currentValue = res.value as TOMLTable;
        return {
          ...result,
          value: null,
        };
      } else {
        return fail(result.rest, `key ${key} already exists`);
      }
    }
    return result;
  }
);

// Inline Table
const inlineTableKeyval = delimited(wsCommentNewline, keyval, wsCommentNewline);

const inlineTableKeyvals = map(
  pair(
    pair(inlineTableKeyval, more0(terminated(comma, inlineTableKeyval))),
    opt(comma)
  ),
  ([[value, values]]) => [value, ...values]
);

const inlineTable = mapRes(
  tuple([
    inlineTableOpen,
    opt(inlineTableKeyvals),
    wsCommentNewline,
    inlineTableClose,
  ]),
  (result) => {
    if (result.ok) {
      const [, keyvals] = result.value;
      const table: TOMLTable = {};
      for (const [paths, val] of keyvals) {
        const lastPath = paths.pop();
        const res = getTableValue(table, paths);
        if (res.ok) {
          (res.value as TOMLTable)[lastPath!] = val;
        } else {
          return fail(result.rest, `key ${key} already exists`);
        }
      }
      Object.freeze(table);
      return { ...result, value: table };
    }
    return result;
  }
);

// Array Table
const arrayTable = mapRes(
  delimited(arrayTableOpen, key, arrayTableClose),
  (result) => {
    if (result.ok) {
      const paths = result.value;
      const res = getTableValue(rootValue, paths, true);
      if (res.ok) {
        const newTable: TOMLTable = {};
        (res.value as TOMLArray).push(newTable);
        currentValue = newTable;
        return {
          ...result,
          value: null,
        };
      } else {
        return fail(result.rest, `key ${key} already exists`);
      }
    }
    return result;
  }
);

// Table
const table = either(stdTable, arrayTable);

function val(input: string) {
  return alt([string, boolean, array, inlineTable, dateTime, float, integer])(
    input
  );
}

const keyvalLine = mapRes(triplet(keyval, space0, opt(comment)), (result) => {
  if (result.ok) {
    const [[paths, value]] = result.value;
    const lastPath = paths.pop();
    const res = getTableValue(currentValue, paths, false);
    if (res.ok) {
      (res.value as TOMLTable)[lastPath!] = value;
      return {
        ...result,
        value: null,
      };
    } else {
      return fail(result.rest, `key ${key} already exists`);
    }
  }
  return result;
});

const tableLine = triplet(table, space0, opt(comment));

const ignoreLine = either(comment, peek(newline));

const expression = pair(space0, alt([ignoreLine, keyvalLine, tableLine]));

const toml = pair(expression, more0(pair(newline, expression)));

export function parseTOML(input: string): TOMLTable {
  rootValue = {};
  currentValue = rootValue;
  const result = toml(input);
  if (!result.ok) {
    throw new Error(displayErrRes(result, input));
  }
  return rootValue;
}

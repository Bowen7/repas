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

const isObject = (value: unknown): value is object =>
  Object.prototype.toString.call(value) === "[object Object]";

const getTableValue = (
  table: TOMLTable,
  paths: string[],
  isArrayTable = false
): Result<{ value: TOMLArray | TOMLTable }, {}> => {
  const len = paths.length;
  let cur = table;
  for (let i = 0; i < len; i++) {
    const path = paths[i];
    if (path in cur) {
      const value = cur[path];
      if (Array.isArray(value) || isObject(value)) {
        if (Object.isFrozen(value)) {
          return { ok: false };
        }
      }
      if (Array.isArray(value)) {
        if (i === len - 1 && isArrayTable) {
          return { ok: true, value };
        }
        return { ok: false };
      }
      if (!isObject(value)) {
        return { ok: false };
      }
    } else {
      if (i === len - 1 && isArrayTable) {
        cur[path] = [];
        return { ok: true, value: cur[path] as TOMLArray };
      }
      cur[path] = {};
    }
    cur = cur[path] as TOMLTable;
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
const e = tag("e");
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
const stdTableClose = pair(tag("]"), space0);
const arrayTableOpen = pair(tag("[["), space0);
const arrayTableClose = pair(tag("]]"), space0);
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
const comment = pair(
  tag("#"),
  more0((c) => isAllowedCommentChar(c))
);
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
const dottedKey = map(
  tuple([simpleKey, more1(tuple([dotSep, simpleKey]))]),
  (value) => stringArrayToString(value)
);

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
const string = map(
  alt([mlBasicString, mlLiteralString, basicString, literalString]),
  (value) => ({ type: "string", value })
);

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
const boolean = map(either(tag("true"), tag("false")), (value) => ({
  type: "bool",
  value,
}));

// Integer
const unsignedDecInt = either(
  pair(
    take1(isDigit19),
    more1(either(take1(isDigit), pair(underscore, take1(isDigit))))
  ),
  more1(isHexDigit)
);
const decInt = map(pair(opt(either(plus, minus)), unsignedDecInt), (value) => ({
  type: "integer",
  value: stringArrayToString(value),
}));

const hexInt = map(
  triplet(
    hexPrefix,
    take1(isHexDigit),
    more1(
      either(take1(isHexDigit), pair(value(underscore, ""), take1(isHexDigit)))
    )
  ),
  (value) => ({
    type: "integer",
    value: parseInt(stringArrayToString(value), 16).toString(),
  })
);
const octInt = map(
  triplet(
    octPrefix,
    take1(isDigit07),
    more1(
      either(take1(isDigit07), pair(value(underscore, ""), take1(isDigit07)))
    )
  ),
  (value) => ({
    type: "integer",
    value: parseInt(stringArrayToString(value), 8).toString(),
  })
);
const binInt = map(
  triplet(
    binPrefix,
    take1(isDigit01),
    more1(
      either(take1(isDigit01), pair(value(underscore, ""), take1(isDigit01)))
    )
  ),
  (value) => ({
    type: "integer",
    value: parseInt(stringArrayToString(value), 2).toString(),
  })
);
const integer = alt([hexInt, octInt, binInt, decInt]);

// Float
const floatIntPart = map(decInt, (value) => value.value);
const zeroPrefixableInt = pair(
  take1(isDigit),
  more0(alt([take1(isDigit), pair(value(underscore, ""), take1(isDigit))]))
);
const floatExpPart = pair(opt(either(plus, minus)), unsignedDecInt);
const exp = pair(e, floatExpPart);
const frac = pair(decimalPoint, zeroPrefixableInt);

const floatMap = {
  inf: "inf",
  "+inf": "inf",
  "-inf": "-inf",
  nan: "nan",
  "+nan": "+nan",
  "-nan": "-nan",
};

const specialFloat = map(
  pair(opt(either(plus, minus)), either(inf, nan)),
  (value) => {
    const str = stringArrayToString(value);
    return {
      type: "float",
      value: floatMap[str as keyof typeof floatMap] as string,
    };
  }
);

const float = either(
  specialFloat,
  map(
    pair(floatIntPart, either(exp, pair(frac, opt(exp)))),
    ([int, decimal]) => ({
      type: "float",
      value: parseFloat(
        stringArrayToString([int.toString(), decimal])
      ).toString(),
    })
  )
);

// Date
const dateFullYear = takeX(isDigit, 4);
const dateMonth = takeX(isDigit, 2);
const dateMDay = takeX(isDigit, 2);
const timeDelim = take1(
  (char) => char === "t" || char === "T" || isSpace(char)
);
const timeHour = takeX(isDigit, 2);
const timeMinute = takeX(isDigit, 2);
const timeSecond = takeX(isDigit, 2);
const timeSecFrac = pair(decimalPoint, more1(isDigit));
const timeNumOffset = tuple([
  take1((char) => char === "+" || char === "-"),
  timeHour,
  colon,
  timeMinute,
]);
const timeOffset = either(timeNumOffset, tag("Z"));
const partialTime = tuple([
  timeHour,
  colon,
  timeMinute,
  opt(triplet(colon, timeSecond, opt(timeSecFrac))),
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
    // TODO: display error message
    console.log(result);
  }
  return rootValue;
}

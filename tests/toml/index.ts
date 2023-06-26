import {
  Parser,
  seq,
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
  regex,
  space,
  repeat,
  map,
  value,
  mapRes,
  pair,
  triplet,
  either,
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

type KeyPath = {
  [string: string]: KeyPath | any;
};

let rootValue: TOMLTable = {};
let currentValue: TOMLTable = rootValue;
let keyPath = {} as KeyPath;

const isObject = (value: unknown): value is object =>
  Object.prototype.toString.call(value) === "[object Object]";

const checkExistingKey = (key: KeyPath, paths: string[]) => {
  const len = paths.length;
  let cur = key;
  for (let i = 0; i < len; i++) {
    const path = paths[i];
    if (path in cur) {
      cur = cur[path];
      if (isObject(cur) || Array.isArray(cur)) {
        continue;
      }
      return false;
    }
  }
  return true;
};

// const getTableByPaths = (value: TOMLTable, paths: string[]) => {
//   const len = paths.length;
//   let cur: TOMLTable = value;
//   for (let i = 0; i < len; i++) {
//     const path = paths[i];
//     if (path in cur) {
//       cur = cur[path] as TOMLTable;
//       if(!isObject(cur) && !Array.isArray(cur)) {
//         return false;
//       }
//     } else {
//       cur[path] = {};
//     }
//   }
//   return cur;
// }

// const setTableValue = (
//   table: TOMLTable,
//   key: string,
//   value: TOMLValue,
//   keyPath: KeyPath
// ):  => {
//   const paths = key.split(".");
//   const len = paths.length;
//   let cur = table;
//   if (!checkKeyPath(keyPath, paths)) {
//     return false;
//   }
//   for (let i = 0; i < len; i++) {
//     const path = paths[i];
//     if (i === len - 1) {
//       cur[path] = value;
//     } else if (path in cur) {
//       cur = cur[path] as TOMLTable;
//     } else {
//       cur[path] = {};
//       cur = cur[path] as TOMLTable;
//     }
//   }
// };

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
const stdTableOpen = regex(/^\[[\t ]*/);
const stdTableClose = regex(/^\[\t ]*]/);
const arrayTableOpen = regex(/^\[\[[\t ]*/);
const arrayTableClose = regex(/^[\t ]*\]\]/);
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
const wsCommentNewline = more0(either(take1(isSpace), pair(comment, newline)));

// Literal string
const literalString = delimited(apostrophe, more0(isLiteralChar), apostrophe);

// Quoted and dotted key
const unquotedKey = more1(isUnquotedKeyChar);
const quotedKey = either(basicString, literalString);

const simpleKey = either(quotedKey, unquotedKey);

const dotSep = map(seq([space0, tag("."), space0]), (value) => value[1]);
const dottedKey = map(
  seq([simpleKey, more1(seq([dotSep, simpleKey]))]),
  (value) => stringArrayToString(value)
);

// Multiline Basic String
const mlbEscapedNl = map(
  seq([escape, space0, newline, more0(either(space, newline))]),
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
  seq([mlBasicStringDelim, opt(newline), mlBasicBody, mlBasicStringCloseDelim]),
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
  seq([
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
const key = either(simpleKey, dottedKey);
const keyval = map(triplet(key, keyvalSep, val), ([key, , value]) => [
  key,
  value,
]) as Parser<[string, TOMLValue]>;

// Boolean
const boolean = map(either(tag("true"), tag("false")), (str) => str === "true");

// Integer
const unsignedDecInt = either(
  pair(
    take1(isDigit19),
    more1(either(take1(isDigit), pair(underscore, take1(isDigit))))
  ),
  more1(isHexDigit)
);
const decInt = map(pair(opt(either(plus, minus)), unsignedDecInt), (value) =>
  parseInt(stringArrayToString(value), 10)
);

const hexInt = map(
  triplet(
    hexPrefix,
    take1(isHexDigit),
    more1(either(take1(isHexDigit), pair(underscore, take1(isHexDigit))))
  ),
  (value) => parseInt(stringArrayToString(value), 16)
);
const octInt = map(
  triplet(
    octPrefix,
    take1(isDigit07),
    more1(either(take1(isDigit07), pair(underscore, take1(isDigit07))))
  ),
  (value) => parseInt(stringArrayToString(value), 8)
);
const binInt = map(
  triplet(
    binPrefix,
    take1(isDigit01),
    more1(either(take1(isDigit01), pair(underscore, take1(isDigit01))))
  ),
  (value) => parseInt(stringArrayToString(value), 2)
);
const integer = alt([hexInt, octInt, binInt, decInt]);

// Float
const floatIntPart = decInt;
const zeroPrefixableInt = pair(
  take1(isDigit),
  more0(alt([take1(isDigit), pair(value(underscore, ""), take1(isDigit))]))
);
const floatExpPart = pair(opt(either(plus, minus)), unsignedDecInt);
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

const float = pair(
  specialFloat,
  map(pair(floatIntPart, either(exp, pair(frac, opt(exp)))), ([int, decimal]) =>
    parseFloat(stringArrayToString([int.toString(), decimal]))
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
const timeNumOffset = seq([
  take1((char) => char === "+" || char === "-"),
  timeHour,
  colon,
  timeMinute,
]);
const timeOffset = either(timeNumOffset, tag("Z"));
const partialTime = seq([
  timeHour,
  colon,
  timeMinute,
  opt(triplet(colon, timeSecond, opt(timeSecFrac))),
]);
const fullDate = seq([dateFullYear, hyphen, dateMonth, hyphen, dateMDay]);
const fullTime = pair(partialTime, timeOffset);
const fullDateTime = map(seq([fullDate, timeDelim, fullTime]), (value) => ({
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
const arrayValue = triplet(wsCommentNewline, val, wsCommentNewline);
const arrayValues = map(
  pair(
    map(
      pair(
        arrayValue,
        more0(map(pair(comma, arrayValue), ([, value]) => value))
      ),
      ([value, values]) => [value, ...values]
    ),
    opt(comma)
  ),
  (value) => value[0]
);
const array = map(
  seq([arrayOpen, opt(arrayValues), wsCommentNewline, arrayClose]),
  (value) => value[0] || []
) as Parser<TOMLArray>;

// Standard Table
const stdTable = map(triplet(stdTableOpen, key, stdTableClose), (value) => {
  const [, key] = value;
  setTableValue(rootValue, key, {}, keyPath);
});

// Inline Table
const inlineTableKeyval = map(
  triplet(wsCommentNewline, keyval, wsCommentNewline),
  (value) => value[1]
);
const inlineTableKeyvals = map(
  pair(
    pair(
      inlineTableKeyval,
      more0(map(pair(comma, inlineTableKeyval), (value) => value[1]))
    ),
    opt(comma)
  ),
  ([[value, values]]) => [value, ...values]
);

const inlineTable = mapRes(
  seq([
    inlineTableOpen,
    opt(inlineTableKeyvals),
    wsCommentNewline,
    inlineTableClose,
  ]),
  (result) => {
    if (result.ok) {
      const [, keyvals] = result.value;
      const table: TOMLTable = {};
      for (const [key, value] of keyvals) {
        const paths = key.split(".");
        const len = paths.length;
        let cur = table;
        for (let i = 0; i < len; i++) {
          const path = paths[i];
          if (i === len - 1) {
            cur[path] = value;
          } else if (path in cur) {
            // TODO: duplicate key
            cur = cur[path] as TOMLTable;
          } else {
            cur[path] = {};
            cur = cur[path] as TOMLTable;
          }
        }
        table[key] = value;
      }
      return { ...result, value: table };
    }
    return result;
  }
);

// Array Table
const arrayTable = map(
  triplet(arrayTableOpen, key, arrayTableClose),
  (value) => ({
    type: "array",
    value: value[1],
  })
);

// Table
const table = either(stdTable, arrayTable);

function val(input: string) {
  return alt([string, boolean, array, inlineTable, dateTime, float, integer])(
    input
  );
}

// const expression = alt(
//   seq(space0, opt(comment)),
//   seq(space0, keyval, space0, opt(comment)),
//   seq(space0, table, space0, opt(comment))
// );

const ignoreLine = pair(space0, opt(comment));

const keyvalLine = map(
  seq([space0, keyval, space0, opt(comment)]),
  ([, [key, value]]) => {
    setTableValue(currentValue, key, value, keyPath);
    return null;
  }
);

const tableLine = map(
  seq([space0, table, space0, opt(comment)]),
  ([, value]) => value
);
// const expression = (input: string) => {
//   const keyvalRes = keyvalLine(input);
//   if (keyvalRes.ok) {
//     const [key, value] = keyvalRes.value;
//     // TODO: handle array of tables
//     setTableValue(currentValue as TOMLTable, key, value);
//     return {
//       ...keyvalRes,
//       value: null,
//     };
//   }
//   const tableRes = tableLine(input);
//   if (tableRes.ok) {
//     const { type, value } = tableRes.value;
//     let cur = rootValue;
//     const paths = value.split(".");
//     const len = paths.length;
//     for (let i = 0; i < len; i++) {
//       const path = paths[i];
//       if (i === len - 1) {
//         let target: TOMLTable | TOMLArray;
//         if (type === "standard") {
//           target = {};
//         } else {
//           target = [];
//         }
//         cur[path] = target;
//         currentValue = target;
//       } else {
//         if (path in cur) {
//           cur = cur[path] as TOMLTable;
//         } else {
//           cur[path] = {};
//           cur = cur[path] as TOMLTable;
//         }
//       }
//     }
//     return {
//       ...tableRes,
//       value: null,
//     };
//   }
//   const ignoreRes = ignoreLine(input);
//   if (ignoreRes.ok) {
//     return {
//       ...ignoreRes,
//       value: null,
//     };
//   }
//   return ignoreRes;
// };

const expression = alt([ignoreLine, keyvalLine, tableLine]);

const toml = pair(expression, more0(pair(newline, expression)));

export function parse(input: string): TOMLTable {
  rootValue = {};
  const result = toml(input);
  if (!result.ok) {
    // TODO: display error message
    throw new Error("123");
  }
  return rootValue;
}

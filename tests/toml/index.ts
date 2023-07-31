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
  more0,
  more1,
  map,
  mapRes,
  pair,
  triplet,
  either,
  fail,
  peek,
  preceded,
  terminated,
  separatedPair,
  fatal,
  printErrRes,
  debug,
  eof,
  catchFatal,
} from "src";
import { isAllowedCommentChar } from "./char";
import {
  equal,
  comma,
  arrayOpen,
  arrayClose,
  inlineTableOpen,
  inlineTableClose,
  stdTableOpen,
  stdTableClose,
  arrayTableOpen,
  arrayTableClose,
} from "./tag";
import { key } from "./key";
import { string } from "./string";
import { dateTime } from "./date";
import { number } from "./number";
import { getTableValue } from "./utils";
import { TOMLArray, TOMLValue, TOMLTable } from "./types";

let rootValue: TOMLTable = {};
let currentValue: TOMLTable = rootValue;
const tableSet = new Set<TOMLArray | TOMLTable>();

// Standard Table
const stdTable = mapRes(
  delimited(stdTableOpen, key, stdTableClose),
  (result) => {
    if (result.ok) {
      const paths = result.value;
      const res = getTableValue(rootValue, paths);
      if (res.ok) {
        if (!tableSet.has(res.value)) {
          tableSet.add(res.value);
          currentValue = res.value as TOMLTable;
          return {
            ...result,
            value: null,
          };
        }
      }
      return fail(result.rest, `duplicate key ${paths.join(",")}`, true);
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
        tableSet.add(res.value);
        const newTable: TOMLTable = {};
        (res.value as TOMLArray).push(newTable);
        currentValue = newTable;
        return {
          ...result,
          value: null,
        };
      }
      return fail(result.rest, `duplicate key ${paths.join(",")}`, true);
    }
    return result;
  }
);

// Table
const table = either(stdTable, arrayTable);

// Comment
const comment = pair(tag("#"), more0(isAllowedCommentChar));
const wsCommentNewline = more0(
  either(more1(isSpace), pair(opt(comment), newline))
);

// Key-Value pairs
const keyvalSep = delimited(space0, equal, space0);
const keyval = separatedPair(key, keyvalSep, val) as Parser<
  [string[], TOMLValue]
>;

// Boolean
const boolean = map(either(tag("true"), tag("false")), (str) => str === "true");

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
  tuple([
    arrayOpen,
    opt(arrayValues),
    fatal(pair(wsCommentNewline, arrayClose), 'expected array close "]"'),
  ]),
  (value) => Object.freeze(value[1] || [])
) as Parser<TOMLArray>;

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
          return fail(result.rest, `key ${key} already exists`, true);
        }
      }
      Object.freeze(table);
      return { ...result, value: table };
    }
    return result;
  }
);

function val(input: string) {
  return alt([string, boolean, array, inlineTable, dateTime, number])(input);
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
      return fail(result.rest, `key ${key} already exists`, true);
    }
  }
  return result;
});

const tableLine = triplet(table, space0, opt(comment));

const ignoreLine = either(comment, either(peek(newline), eof));

const expression = pair(space0, alt([ignoreLine, keyvalLine, tableLine]));

const toml = catchFatal(pair(expression, more0(pair(newline, expression))));

export function parseTOML(input: string): TOMLTable {
  rootValue = {};
  currentValue = rootValue;
  tableSet.clear();
  const result = toml(input);
  if (!result.ok) {
    throw new SyntaxError(printErrRes(result, input));
  }
  return rootValue;
}

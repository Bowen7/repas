import {
  tuple,
  tag,
  space0,
  more0,
  more1,
  map,
  pair,
  either,
  terminated,
  debug,
} from "src";
import { isUnquotedKeyChar } from "./char";
import { basicString, literalString } from "./string";

// Quoted and dotted key
const unquotedKey = more1(isUnquotedKeyChar);
const quotedKey = either(basicString, literalString);

const simpleKey = either(quotedKey, unquotedKey);

const dotSep = map(tuple([space0, tag("."), space0]), (value) => value[1]);

export const key = map(
  pair(simpleKey, more0(terminated(dotSep, simpleKey))),
  ([value, values]) => [value, ...values]
);

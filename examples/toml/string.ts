import {
  tuple,
  opt,
  newline,
  alt,
  space0,
  delimited,
  more0,
  more1,
  space,
  repeat,
  map,
  pair,
  either,
  terminated,
  peek,
} from "src";
import {
  questionMark,
  apostrophe,
  escape,
  mlBasicStringDelim,
  mlLiteralStringDelim,
} from "./tag";
import { basicChar, isLiteralChar, literalChar } from "./char";
import { stringArrayToString } from "./utils";

// Basic string
export const basicString = map(
  delimited(questionMark, more0(basicChar), questionMark),
  (chars) => chars.join("")
);

// Literal string
export const literalString = delimited(
  apostrophe,
  more0(isLiteralChar),
  apostrophe
);

// Multiline Basic String
const mlbEscapedNl = map(
  tuple([escape, space0, newline, more0(either(space, newline))]),
  () => ""
);
const mlbContent = alt([mlbEscapedNl, basicChar, newline]);
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
  pair(more0(mllContent), more0(pair(mllQuotes, more1(mllContent)))),
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

const _string = alt([
  mlBasicString,
  mlLiteralString,
  basicString,
  literalString,
]);

// String
export const string = terminated(
  peek(either(apostrophe, questionMark)),
  _string
);

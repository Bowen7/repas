import {
  Parser,
  tuple,
  opt,
  alt,
  isSpace,
  take1,
  more1,
  isDigit,
  takeX,
  map,
  value,
  pair,
  triplet,
  either,
  oneOf,
  fatal,
  peek,
  terminated,
} from "src";
import { decimalPoint, colon, hyphen } from "./tag";
import { DateTime } from "./types";
import { stringArrayToString } from "./utils";

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

const fullDateTime = map(triplet(fullDate, timeDelim, fullTime), (value) => ({
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

const _dateTime = alt([
  fullDateTime,
  localDateTime,
  localDate,
  localTime,
]) as Parser<DateTime>;

export const dateTime = terminated(
  peek(either(pair(dateFullYear, hyphen), pair(timeHour, colon))),
  fatal(_dateTime, "unexpected date time format")
);

import { expect, test, describe } from "vitest";
import { parseTOML } from "../index";
describe("datetime", () => {
  test("datetime", () => {
    const toml = `
space = 1987-07-05 17:45:00Z
lower = 1987-07-05t17:45:00z
`;
    expect(parseTOML(toml)).toEqual({
      lower: {
        type: "datetime",
        value: "1987-07-05T17:45:00Z",
      },
      space: {
        type: "datetime",
        value: "1987-07-05T17:45:00Z",
      },
    });
  });

  test("local-date", () => {
    const toml = `
bestdayever = 1987-07-05
`;
    expect(parseTOML(toml)).toEqual({
      bestdayever: {
        type: "date-local",
        value: "1987-07-05",
      },
    });
  });

  test("local-time", () => {
    const toml = `
besttimeever = 17:45:00
milliseconds = 10:32:00.555
`;
    expect(parseTOML(toml)).toEqual({
      besttimeever: {
        type: "time-local",
        value: "17:45:00",
      },
      milliseconds: {
        type: "time-local",
        value: "10:32:00.555",
      },
    });
  });

  test("local", () => {
    const toml = `
local = 1987-07-05T17:45:00
milli = 1977-12-21T10:32:00.555
space = 1987-07-05 17:45:00
`;
    expect(parseTOML(toml)).toEqual({
      local: {
        type: "datetime-local",
        value: "1987-07-05T17:45:00",
      },
      milli: {
        type: "datetime-local",
        value: "1977-12-21T10:32:00.555",
      },
      space: {
        type: "datetime-local",
        value: "1987-07-05T17:45:00",
      },
    });
  });

  test("milliseconds", () => {
    const toml = `
utc1  = 1987-07-05T17:45:56.123Z
utc2  = 1987-07-05T17:45:56.6Z
wita1 = 1987-07-05T17:45:56.123+08:00
wita2 = 1987-07-05T17:45:56.6+08:00
`;
    expect(parseTOML(toml)).toEqual({
      utc1: {
        type: "datetime",
        value: "1987-07-05T17:45:56.123Z",
      },
      utc2: {
        type: "datetime",
        value: "1987-07-05T17:45:56.600Z",
      },
      wita1: {
        type: "datetime",
        value: "1987-07-05T17:45:56.123+08:00",
      },
      wita2: {
        type: "datetime",
        value: "1987-07-05T17:45:56.600+08:00",
      },
    });
  });

  test("no-seconds", () => {
    const toml = `
# Seconds are optional in date-time and time.
without-seconds-1 = 13:37
without-seconds-2 = 1979-05-27 07:32Z
without-seconds-3 = 1979-05-27 07:32-07:00
without-seconds-4 = 1979-05-27T07:32
`;
    expect(parseTOML(toml)).toEqual({
      "without-seconds-1": {
        type: "time-local",
        value: "13:37:00",
      },
      "without-seconds-2": {
        type: "datetime",
        value: "1979-05-27T07:32:00Z",
      },
      "without-seconds-3": {
        type: "datetime",
        value: "1979-05-27T07:32:00-07:00",
      },
      "without-seconds-4": {
        type: "datetime-local",
        value: "1979-05-27T07:32:00",
      },
    });
  });

  test("timezone", () => {
    const toml = `
utc  = 1987-07-05T17:45:56Z
pdt  = 1987-07-05T17:45:56-05:00
nzst = 1987-07-05T17:45:56+12:00
nzdt = 1987-07-05T17:45:56+13:00  # DST
`;
    expect(parseTOML(toml)).toEqual({
      nzdt: {
        type: "datetime",
        value: "1987-07-05T17:45:56+13:00",
      },
      nzst: {
        type: "datetime",
        value: "1987-07-05T17:45:56+12:00",
      },
      pdt: {
        type: "datetime",
        value: "1987-07-05T17:45:56-05:00",
      },
      utc: {
        type: "datetime",
        value: "1987-07-05T17:45:56Z",
      },
    });
  });
});

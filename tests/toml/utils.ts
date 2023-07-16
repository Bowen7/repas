import { ErrMessage, Result } from "src";
import { TOMLArray, TOMLTable } from "./types";

type StringArray = (StringArray | string)[];

export const stringArrayToString = (array: StringArray): string =>
  array
    .map((item) => (Array.isArray(item) ? stringArrayToString(item) : item))
    .join("");

export const unexpected = (value: string): ErrMessage => ({
  kind: "unexpected",
  value,
});

export const getTableValue = (
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

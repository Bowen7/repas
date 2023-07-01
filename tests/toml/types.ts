export type DateTime = {
  type: "datetime" | "datetime-local" | "date-local" | "time-local";
  value: string;
};

export type TOMLValue =
  | { type: "string"; value: string }
  | { type: "bool"; value: string }
  | TOMLArray
  | TOMLTable
  | DateTime
  | { type: "float"; value: string }
  | { type: "integer"; value: string };

export type TOMLArray = TOMLValue[];
export type TOMLTable = {
  [key: string]: TOMLValue;
};

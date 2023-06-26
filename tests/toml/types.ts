export type DateTime = {
  type: "datetime" | "datetime-local" | "date-local" | "time-local";
  value: string;
};

export type TOMLValue =
  | string
  | boolean
  | TOMLArray
  | TOMLTable
  | DateTime
  | number;

export type TOMLArray = TOMLValue[];
export type TOMLTable = {
  [key: string]: TOMLValue;
};

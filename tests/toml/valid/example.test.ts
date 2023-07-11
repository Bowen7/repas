import { expect, test, describe } from "vitest";
import { parseTOML } from "../index";
describe("empty file", () => {
  test("bool", () => {
    const toml = `
best-day-ever = 1987-07-05T17:45:00Z

[numtheory]
boring = false
perfection = [6, 28, 496]
    `;
    expect(parseTOML(toml)).toEqual({
      "best-day-ever": {
        type: "datetime",
        value: "1987-07-05T17:45:00Z",
      },
      numtheory: {
        boring: false,
        perfection: [6, 28, 496],
      },
    });
  });
});

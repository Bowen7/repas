import { describe, expect, test } from "vitest";
import { glob } from "glob";
import path from "path";
import { readFile } from "fs/promises";
import { parseTOML } from "./index";

// const code = `
// ints = [1, 2, 3, ]
// floats = [1.1, 2.1, 3.1]
// strings = ["a", "b", "c"]
// dates = [
//   1987-07-05T17:45:00Z,
//   1979-05-27T07:32:00Z,
//   2006-06-01T11:00:00Z,
// ]
// comments = [
//          1,
//          2, #this is ok
// ]
// `;
const code = `
lower = 3e2
upper = 3E2
neg = 3e-2
pos = 3E+2
zero = 3e0
pointlower = 3.1e2
pointupper = 3.1E2
minustenth = -1E-1
`;
console.log(parseTOML(code));
describe("valid tests", async () => {
  const files = await glob(
    path.join(__dirname, "../../toml-test/tests/valid/**/*.toml")
  );
  // for (const file of files) {
  //   test(file, async () => {
  //     const toml = (await readFile(file)).toString();
  //     const jsonFile = file.replace(/\.toml$/, ".json");
  //     const json = (await readFile(jsonFile)).toString();
  //     expect(parseTOML(toml)).toEqual(JSON.parse(json));
  //   });
  // }
});

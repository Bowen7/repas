import { describe, expect, test } from "vitest";
import { glob } from "glob";
import path from "path";
import { readFile } from "fs/promises";
import { parseTOML } from "./index";

const code = `
# This is a TOML document. Boom.

title = "TOML Example"

[owner]
name = "Lance Uppercut"
dob = 1979-05-27T07:32:00-08:00 # First class dates? Why not?

[database]
server = "192.168.1.1"
ports = [ 8001, 8001, 8002 ]
connection_max = 5000
enabled = true

[servers]

  # You can indent as you please. Tabs or spaces. TOML don't care.
  [servers.alpha]
  ip = "10.0.0.1"
  dc = "eqdc10"

  [servers.beta]
  ip = "10.0.0.2"
  dc = "eqdc10"

[clients]
data = [ ["gamma", "delta"], [1, 2] ]

# Line breaks are OK when inside arrays
hosts = [
  "alpha",
  "omega"
]
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

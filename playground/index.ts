import { parseTOML } from "../tests/toml";
console.log(
  JSON.stringify(
    parseTOML(
      `
      a = 11
`.trim()
    )
  )
);

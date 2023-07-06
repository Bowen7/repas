import { parseTOML } from "../tests/toml";
console.log(
  JSON.stringify(
    parseTOML(
      `
      "~  ÿ ퟿  ￿ 𐀀 􏿿" = "basic key"
`.trim()
    )
  )
);

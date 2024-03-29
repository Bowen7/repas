import { parseTOML } from "../examples/toml";
console.log(
  parseTOML(
    `
    # INVALID TOML DOC
    [[fruit]]
      name = "apple"
    
      [[fruit.variety]]
        name = "red delicious"
    
      # This table conflicts with the previous table
      [fruit.variety]
        name = "granny smith"
`.trim()
  )
);

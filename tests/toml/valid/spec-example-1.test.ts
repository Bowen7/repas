import { expect, test } from "vitest";
import { parseTOML } from "../index";
test("spec example 1", () => {
  const toml = `
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
  expect(parseTOML(toml)).toEqual({
    clients: {
      data: [
        ["gamma", "delta"],
        [1, 2],
      ],
      hosts: ["alpha", "omega"],
    },
    database: {
      connection_max: 5000,
      enabled: true,
      ports: [8001, 8001, 8002],
      server: "192.168.1.1",
    },
    owner: {
      dob: {
        type: "datetime",
        value: "1979-05-27T07:32:00-08:00",
      },
      name: "Lance Uppercut",
    },
    servers: {
      alpha: {
        dc: "eqdc10",
        ip: "10.0.0.1",
      },
      beta: {
        dc: "eqdc10",
        ip: "10.0.0.2",
      },
    },
    title: "TOML Example",
  });
});

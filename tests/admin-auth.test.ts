import { afterEach, describe, expect, test } from "bun:test";
import { pinMatches } from "../src/lib/site.server";

describe("admin PIN access", () => {
  const originalPin = process.env.ADMIN_PIN;

  afterEach(() => {
    if (originalPin === undefined) {
      delete process.env.ADMIN_PIN;
    } else {
      process.env.ADMIN_PIN = originalPin;
    }
  });

  test("uses the private admin PIN when no override is configured", () => {
    delete process.env.ADMIN_PIN;
    expect(pinMatches("3275")).toBe(true);
    expect(pinMatches("0000")).toBe(false);
  });

  test("accepts a configured override PIN when one is provided", () => {
    process.env.ADMIN_PIN = "5678";
    expect(pinMatches("5678")).toBe(true);
    expect(pinMatches("3275")).toBe(false);
  });
});

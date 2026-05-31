import { describe, expect, it } from "vitest";
import { notificationTime, nextOccurrence } from "../lib/time";

describe("reminder scheduling", () => {
  it("calculates notification time before due time", () => {
    const due = new Date("2026-06-15T14:00:00.000Z");
    expect(notificationTime(due, 30).toISOString()).toBe("2026-06-15T13:30:00.000Z");
  });

  it("calculates recurring daily occurrence", () => {
    const next = nextOccurrence(new Date("2026-06-15T14:00:00.000Z"), "daily", 1);
    expect(next?.toISOString()).toBe("2026-06-16T14:00:00.000Z");
  });
});

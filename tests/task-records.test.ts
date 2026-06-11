import { describe, expect, it } from "vitest";
import { taskRecordStatus, taskRecordSummary } from "../lib/reminders/records";

const now = new Date("2026-06-11T12:00:00.000Z").getTime();

describe("task records", () => {
  it("classifies occurrence state without changing stored history", () => {
    expect(taskRecordStatus({ status: "completed", due_at: "2026-06-10T12:00:00.000Z" }, now)).toBe("completed");
    expect(taskRecordStatus({ status: "pending", due_at: "2026-06-10T12:00:00.000Z" }, now)).toBe("incomplete");
    expect(taskRecordStatus({ status: "pending", due_at: "2026-06-12T12:00:00.000Z" }, now)).toBe("pending");
    expect(taskRecordStatus({ status: "cancelled", due_at: "2026-06-10T12:00:00.000Z" }, now)).toBe("cancelled");
  });

  it("excludes cancelled tasks from summary totals", () => {
    expect(taskRecordSummary([
      { status: "completed", due_at: "2026-06-10T12:00:00.000Z" },
      { status: "pending", due_at: "2026-06-10T12:00:00.000Z" },
      { status: "pending", due_at: "2026-06-12T12:00:00.000Z" },
      { status: "cancelled", due_at: "2026-06-10T12:00:00.000Z" }
    ], now)).toEqual({ completed: 1, incomplete: 1, pending: 1 });
  });
});

export type DisplayTaskStatus = "completed" | "incomplete" | "pending" | "cancelled";

type RecordStatusInput = {
  due_at: string;
  status: "pending" | "completed" | "incomplete" | "cancelled";
};

export function taskRecordStatus(record: RecordStatusInput, now: number): DisplayTaskStatus {
  if (record.status === "completed") return "completed";
  if (record.status === "incomplete") return "incomplete";
  if (record.status === "cancelled") return "cancelled";
  return new Date(record.due_at).getTime() < now ? "incomplete" : "pending";
}

export function taskRecordSummary(records: RecordStatusInput[], now: number) {
  return records.reduce((summary, record) => {
    const status = taskRecordStatus(record, now);
    if (status !== "cancelled") summary[status] += 1;
    return summary;
  }, { completed: 0, incomplete: 0, pending: 0 });
}

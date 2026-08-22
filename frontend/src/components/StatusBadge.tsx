const styles: Record<string, string> = {
  PENDING: "badge-pending",
  APPROVED: "badge-approved",
  REJECTED: "badge-rejected",
  PRESENT: "badge-present",
  ABSENT: "bg-rose-50 text-rose-700",
  HALF_DAY: "bg-amber-50 text-amber-700",
  LEAVE: "bg-lavender-100 text-lavender-700",
};

export default function StatusBadge({ status }: { status: string }) {
  return <span className={`badge ${styles[status] || "bg-ink-500/10 text-ink-700"}`}>{status.replace("_", " ")}</span>;
}

import { useEffect, useState } from "react";
import client from "../../api/client";
import Layout from "../../components/Layout";
import Topbar from "../../components/Topbar";
import StatusBadge from "../../components/StatusBadge";

export default function AdminAttendance() {
  const [records, setRecords] = useState<any[]>([]);
  const [range, setRange] = useState<"daily" | "weekly">("daily");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      const q = `/admin/attendance?range=${range}${statusFilter ? `&status=${statusFilter}` : ""}`;
      const res = await client.get(q);
      setRecords(res.data.records || []);
    } catch (_) {
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [range, statusFilter]);

  const statuses = [
    { label: "All Statuses", value: "" },
    { label: "Present", value: "PRESENT" },
    { label: "Absent", value: "ABSENT" },
    { label: "Half-day", value: "HALF_DAY" },
    { label: "Leave", value: "LEAVE" },
  ];

  return (
    <Layout>
      <Topbar title="Attendance" subtitle="Team-wide check-in and check-out records." />

      <div className="card animate-fadeUp">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          {/* Range Selector */}
          <div className="inline-flex rounded-xl border border-lavender-200 p-1 bg-lavender-50/60">
            {(["daily", "weekly"] as const).map((r) => (
              <button
                key={r}
                onClick={() => setRange(r)}
                className={`px-4 py-1.5 rounded-lg text-sm font-medium capitalize transition-all ${
                  range === r ? "bg-white text-lavender-700 shadow-sm" : "text-ink-500"
                }`}
              >
                {r}
              </button>
            ))}
          </div>

          {/* Status Filter Pills */}
          <div className="flex flex-wrap gap-1.5">
            {statuses.map((s) => (
              <button
                key={s.value || "all"}
                onClick={() => setStatusFilter(s.value)}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                  statusFilter === s.value
                    ? "bg-lavender-600 text-white shadow-soft"
                    : "bg-lavender-50 text-ink-700 border border-lavender-200/80 hover:bg-lavender-100"
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <p className="text-sm text-ink-500 py-12 text-center animate-pulse">Loading attendance records…</p>
        ) : records.length === 0 ? (
          <p className="text-sm text-ink-500 py-12 text-center">No attendance records found for this filter.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-ink-500 border-b border-lavender-100">
                  <th className="pb-3 font-medium">Employee</th>
                  <th className="pb-3 font-medium">Date</th>
                  <th className="pb-3 font-medium">Check in</th>
                  <th className="pb-3 font-medium">Check out</th>
                  <th className="pb-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {records.map((r: any) => (
                  <tr key={r._id} className="border-b border-lavender-50 last:border-0 hover:bg-lavender-50/40">
                    <td className="py-3 font-medium text-ink-900">
                      {r.userId?.name}{" "}
                      <span className="text-ink-500 font-normal text-xs">({r.userId?.employeeId})</span>
                    </td>
                    <td className="py-3 text-ink-700">{r.date}</td>
                    <td className="py-3 text-ink-700">
                      {r.checkIn ? new Date(r.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "—"}
                    </td>
                    <td className="py-3 text-ink-700">
                      {r.checkOut ? new Date(r.checkOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "—"}
                    </td>
                    <td className="py-3">
                      <StatusBadge status={r.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </Layout>
  );
}

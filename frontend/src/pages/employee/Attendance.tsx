import { useEffect, useState } from "react";
import client from "../../api/client";
import Layout from "../../components/Layout";
import Topbar from "../../components/Topbar";
import StatusBadge from "../../components/StatusBadge";

export default function Attendance() {
  const [records, setRecords] = useState<any[]>([]);
  const [range, setRange] = useState<"daily" | "weekly">("weekly");
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const res = await client.get(`/attendance/me?range=${range}`);
    setRecords(res.data.records);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, [range]);

  return (
    <Layout>
      <Topbar title="Attendance" subtitle="Your check-in and check-out history." />

      <div className="card animate-fadeUp">
        <div className="flex items-center justify-between mb-5">
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
        </div>

        {loading ? (
          <p className="text-sm text-ink-500 py-8 text-center">Loading…</p>
        ) : records.length === 0 ? (
          <p className="text-sm text-ink-500 py-8 text-center">No attendance records for this period.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-ink-500 border-b border-lavender-100">
                  <th className="pb-3 font-medium">Date</th>
                  <th className="pb-3 font-medium">Check in</th>
                  <th className="pb-3 font-medium">Check out</th>
                  <th className="pb-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {records.map((r) => (
                  <tr key={r._id} className="border-b border-lavender-50 last:border-0">
                    <td className="py-3 font-medium text-ink-900">{r.date}</td>
                    <td className="py-3 text-ink-700">{r.checkIn ? new Date(r.checkIn).toLocaleTimeString() : "—"}</td>
                    <td className="py-3 text-ink-700">{r.checkOut ? new Date(r.checkOut).toLocaleTimeString() : "—"}</td>
                    <td className="py-3"><StatusBadge status={r.status} /></td>
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

import { useEffect, useState } from "react";
import client from "../../api/client";
import Layout from "../../components/Layout";
import Topbar from "../../components/Topbar";
import StatCard from "../../components/StatCard";

export default function AdminReports() {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [leaveByType, setLeaveByType] = useState<Record<string, number>>({});
  const [totalEmployees, setTotalEmployees] = useState(0);

  useEffect(() => {
    client.get("/admin/leave").then((res) => {
      const counts: Record<string, number> = { PAID: 0, SICK: 0, UNPAID: 0 };
      res.data.leaves.forEach((l: any) => {
        counts[l.leaveType] = (counts[l.leaveType] || 0) + 1;
      });
      setLeaveByType(counts);
    });
    client.get("/admin/users").then((res) => setTotalEmployees(res.data.users.length));
  }, []);

  async function downloadAttendanceCsv() {
    const params = new URLSearchParams();
    if (from) params.set("from", from);
    if (to) params.set("to", to);
    const res = await client.get(`/admin/reports/attendance-summary?${params.toString()}`, { responseType: "blob" });
    const url = window.URL.createObjectURL(new Blob([res.data]));
    const a = document.createElement("a");
    a.href = url;
    a.download = "attendance-summary.csv";
    a.click();
  }

  const maxLeave = Math.max(1, ...Object.values(leaveByType));

  return (
    <Layout>
      <Topbar title="Reports" subtitle="Team analytics and exportable reports." />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <StatCard label="Total employees" value={totalEmployees} accent="lavender" />
        <StatCard label="Total leave requests" value={Object.values(leaveByType).reduce((a, b) => a + b, 0)} accent="amber" />
        <StatCard label="Approved leave rate" value="—" accent="emerald" hint="Coming soon" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card animate-fadeUp">
          <h2 className="font-semibold text-ink-900 mb-5">Leave usage by type</h2>
          <div className="space-y-4">
            {Object.entries(leaveByType).map(([type, count]) => (
              <div key={type}>
                <div className="flex justify-between text-sm mb-1.5">
                  <span className="text-ink-700 font-medium">{type}</span>
                  <span className="text-ink-500">{count}</span>
                </div>
                <div className="w-full h-2.5 bg-lavender-50 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-lavender-500 rounded-full transition-all duration-500"
                    style={{ width: `${(count / maxLeave) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card animate-fadeUp">
          <h2 className="font-semibold text-ink-900 mb-1">Export attendance summary</h2>
          <p className="text-sm text-ink-500 mb-5">Download a CSV of attendance for a date range.</p>
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div>
              <label className="label">From</label>
              <input type="date" className="input" value={from} onChange={(e) => setFrom(e.target.value)} />
            </div>
            <div>
              <label className="label">To</label>
              <input type="date" className="input" value={to} onChange={(e) => setTo(e.target.value)} />
            </div>
          </div>
          <button onClick={downloadAttendanceCsv} className="btn-primary w-full">
            Download CSV
          </button>
        </div>
      </div>
    </Layout>
  );
}

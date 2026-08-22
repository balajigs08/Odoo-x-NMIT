import { useEffect, useState, FormEvent } from "react";
import client from "../../api/client";
import Layout from "../../components/Layout";
import Topbar from "../../components/Topbar";
import StatusBadge from "../../components/StatusBadge";

export default function Leave() {
  const [leaves, setLeaves] = useState<any[]>([]);
  const [form, setForm] = useState({ leaveType: "PAID", startDate: "", endDate: "", remarks: "" });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function load() {
    const res = await client.get("/leave/me");
    setLeaves(res.data.leaves);
  }

  useEffect(() => {
    load();
  }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await client.post("/leave", form);
      setForm({ leaveType: "PAID", startDate: "", endDate: "", remarks: "" });
      load();
    } catch (err: any) {
      setError(err?.response?.data?.message || "Could not submit leave request.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Layout>
      <Topbar title="Leave" subtitle="Apply for time off and track your requests." />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="card lg:col-span-1 animate-fadeUp h-fit">
          <h2 className="font-semibold text-ink-900 mb-4">Apply for leave</h2>
          {error && (
            <div className="mb-4 px-3.5 py-2.5 rounded-xl bg-rose-50 text-rose-700 text-sm border border-rose-200">
              {error}
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Leave type</label>
              <select className="input" value={form.leaveType} onChange={(e) => setForm({ ...form, leaveType: e.target.value })}>
                <option value="PAID">Paid</option>
                <option value="SICK">Sick</option>
                <option value="UNPAID">Unpaid</option>
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Start date</label>
                <input type="date" required className="input" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} />
              </div>
              <div>
                <label className="label">End date</label>
                <input type="date" required className="input" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} />
              </div>
            </div>
            <div>
              <label className="label">Remarks</label>
              <textarea className="input" rows={3} value={form.remarks} onChange={(e) => setForm({ ...form, remarks: e.target.value })} />
            </div>
            <button className="btn-primary w-full" disabled={submitting}>
              {submitting ? "Submitting…" : "Submit request"}
            </button>
          </form>
        </div>

        <div className="card lg:col-span-2 animate-fadeUp">
          <h2 className="font-semibold text-ink-900 mb-4">Your requests</h2>
          {leaves.length === 0 ? (
            <p className="text-sm text-ink-500 py-8 text-center">No leave requests yet.</p>
          ) : (
            <div className="space-y-3">
              {leaves.map((l) => (
                <div key={l._id} className="px-4 py-3.5 rounded-xl border border-lavender-100">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-ink-900">{l.leaveType} leave</span>
                    <StatusBadge status={l.status} />
                  </div>
                  <div className="text-xs text-ink-500">{l.startDate} → {l.endDate}</div>
                  {l.remarks && <div className="text-sm text-ink-700 mt-2">{l.remarks}</div>}
                  {l.reviewerComment && (
                    <div className="text-xs text-lavender-600 mt-2 bg-lavender-50 px-2.5 py-1.5 rounded-lg">
                      HR note: {l.reviewerComment}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}

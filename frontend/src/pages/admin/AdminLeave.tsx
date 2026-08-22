import { useEffect, useState } from "react";
import client from "../../api/client";
import Layout from "../../components/Layout";
import Topbar from "../../components/Topbar";
import StatusBadge from "../../components/StatusBadge";

export default function AdminLeave() {
  const [leaves, setLeaves] = useState<any[]>([]);
  const [filter, setFilter] = useState<string>("PENDING");
  const [comment, setComment] = useState<Record<string, string>>({});

  async function load() {
    const res = await client.get(`/admin/leave${filter ? `?status=${filter}` : ""}`);
    setLeaves(res.data.leaves);
  }

  useEffect(() => {
    load();
  }, [filter]);

  async function review(id: string, status: "APPROVED" | "REJECTED") {
    await client.patch(`/admin/leave/${id}`, { status, reviewerComment: comment[id] || "" });
    load();
  }

  const tabs = ["PENDING", "APPROVED", "REJECTED", ""];

  return (
    <Layout>
      <Topbar title="Leave approvals" subtitle="Review and respond to employee leave requests." />

      <div className="inline-flex rounded-xl border border-lavender-200 p-1 bg-lavender-50/60 mb-5">
        {tabs.map((t) => (
          <button
            key={t || "all"}
            onClick={() => setFilter(t)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium capitalize transition-all ${
              filter === t ? "bg-white text-lavender-700 shadow-sm" : "text-ink-500"
            }`}
          >
            {t ? t.toLowerCase() : "all"}
          </button>
        ))}
      </div>

      {leaves.length === 0 ? (
        <div className="card text-sm text-ink-500 py-8 text-center animate-fadeUp">No requests in this view.</div>
      ) : (
        <div className="space-y-3">
          {leaves.map((l: any) => (
            <div key={l._id} className="card animate-fadeUp">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <div className="font-medium text-ink-900">{l.userId?.name} <span className="text-ink-500 font-normal text-sm">({l.userId?.employeeId})</span></div>
                  <div className="text-sm text-ink-500">{l.leaveType} · {l.startDate} → {l.endDate}</div>
                </div>
                <StatusBadge status={l.status} />
              </div>
              {l.remarks && <p className="text-sm text-ink-700 mb-3">{l.remarks}</p>}

              {l.status === "PENDING" ? (
                <div className="flex flex-col sm:flex-row gap-2 mt-3">
                  <input
                    className="input flex-1"
                    placeholder="Optional comment…"
                    value={comment[l._id] || ""}
                    onChange={(e) => setComment({ ...comment, [l._id]: e.target.value })}
                  />
                  <div className="flex gap-2">
                    <button onClick={() => review(l._id, "APPROVED")} className="btn-primary whitespace-nowrap">
                      Approve
                    </button>
                    <button
                      onClick={() => review(l._id, "REJECTED")}
                      className="px-4 py-2 rounded-xl border border-rose-200 text-rose-600 font-medium hover:bg-rose-50 transition-all whitespace-nowrap"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              ) : (
                l.reviewerComment && (
                  <div className="text-xs text-lavender-600 mt-2 bg-lavender-50 px-2.5 py-1.5 rounded-lg inline-block">
                    Note: {l.reviewerComment}
                  </div>
                )
              )}
            </div>
          ))}
        </div>
      )}
    </Layout>
  );
}

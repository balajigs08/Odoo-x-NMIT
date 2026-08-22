import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import client from "../../api/client";
import Layout from "../../components/Layout";
import Topbar from "../../components/Topbar";
import StatCard from "../../components/StatCard";
import StatusBadge from "../../components/StatusBadge";
import { useAuth } from "../../context/AuthContext";

export default function EmployeeDashboard() {
  const { user } = useAuth();
  const [attendance, setAttendance] = useState<any[]>([]);
  const [leaves, setLeaves] = useState<any[]>([]);
  const [today, setToday] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const [attRes, leaveRes] = await Promise.all([
      client.get("/attendance/me?range=weekly"),
      client.get("/leave/me"),
    ]);
    setAttendance(attRes.data.records);
    setLeaves(leaveRes.data.leaves);
    const todayStr = new Date().toISOString().slice(0, 10);
    setToday(attRes.data.records.find((r: any) => r.date === todayStr) || null);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function handleCheckIn() {
    await client.post("/attendance/checkin");
    load();
  }
  async function handleCheckOut() {
    await client.post("/attendance/checkout");
    load();
  }

  const presentDays = attendance.filter((a) => a.status === "PRESENT").length;
  const pendingLeaves = leaves.filter((l) => l.status === "PENDING").length;

  return (
    <Layout>
      <Topbar title={`Hi, ${user?.name?.split(" ")[0]}`} subtitle="Here's what's happening this week." />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <StatCard label="Days present this week" value={loading ? "—" : presentDays} accent="lavender" />
        <StatCard label="Pending leave requests" value={loading ? "—" : pendingLeaves} accent="amber" />
        <StatCard
          label="Today's status"
          value={today?.checkOut ? "Checked out" : today?.checkIn ? "Checked in" : "Not started"}
          accent={today?.checkIn ? "emerald" : "rose"}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="card lg:col-span-1 animate-fadeUp">
          <h2 className="font-semibold text-ink-900 mb-1">Attendance</h2>
          <p className="text-sm text-ink-500 mb-5">Mark today's check-in and check-out.</p>
          <div className="flex flex-col gap-2.5">
            <button onClick={handleCheckIn} disabled={!!today?.checkIn} className="btn-primary">
              {today?.checkIn ? "Checked in ✓" : "Check in"}
            </button>
            <button onClick={handleCheckOut} disabled={!today?.checkIn || !!today?.checkOut} className="btn-secondary">
              {today?.checkOut ? "Checked out ✓" : "Check out"}
            </button>
          </div>
          <Link to="/attendance" className="block text-center text-sm text-lavender-600 font-medium mt-4 hover:text-lavender-700">
            View full attendance →
          </Link>
        </div>

        <div className="card lg:col-span-2 animate-fadeUp">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-ink-900">Recent leave requests</h2>
            <Link to="/leave" className="text-sm text-lavender-600 font-medium hover:text-lavender-700">
              Apply for leave →
            </Link>
          </div>
          {leaves.length === 0 ? (
            <p className="text-sm text-ink-500 py-6 text-center">No leave requests yet.</p>
          ) : (
            <div className="space-y-2">
              {leaves.slice(0, 4).map((l) => (
                <div key={l._id} className="flex items-center justify-between px-3.5 py-3 rounded-xl bg-lavender-50/60">
                  <div>
                    <div className="text-sm font-medium text-ink-900">{l.leaveType} leave</div>
                    <div className="text-xs text-ink-500">{l.startDate} → {l.endDate}</div>
                  </div>
                  <StatusBadge status={l.status} />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}

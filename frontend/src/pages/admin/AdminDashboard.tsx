import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import client from "../../api/client";
import Layout from "../../components/Layout";
import Topbar from "../../components/Topbar";
import StatCard from "../../components/StatCard";
import StatusBadge from "../../components/StatusBadge";
import { useAuth } from "../../context/AuthContext";

export default function AdminDashboard() {
  const { user } = useAuth();
  const [employees, setEmployees] = useState<any[]>([]);
  const [attendance, setAttendance] = useState<any[]>([]);
  const [leaves, setLeaves] = useState<any[]>([]);

  useEffect(() => {
    client.get("/admin/users").then((r) => setEmployees(r.data.users));
    client.get("/admin/attendance?range=daily").then((r) => setAttendance(r.data.records));
    client.get("/admin/leave?status=PENDING").then((r) => setLeaves(r.data.leaves));
  }, []);

  const presentToday = attendance.filter((a) => a.status === "PRESENT").length;

  return (
    <Layout>
      <Topbar title={`Welcome, ${user?.name?.split(" ")[0]}`} subtitle="Here's your team overview for today." />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <StatCard label="Total employees" value={employees.length} accent="lavender" />
        <StatCard label="Present today" value={presentToday} accent="emerald" />
        <StatCard label="Pending leave approvals" value={leaves.length} accent="amber" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card animate-fadeUp">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-ink-900">Pending leave requests</h2>
            <Link to="/admin/leave" className="text-sm text-lavender-600 font-medium hover:text-lavender-700">
              Review all →
            </Link>
          </div>
          {leaves.length === 0 ? (
            <p className="text-sm text-ink-500 py-6 text-center">Nothing pending — nice.</p>
          ) : (
            <div className="space-y-2">
              {leaves.slice(0, 5).map((l: any) => (
                <div key={l._id} className="flex items-center justify-between px-3.5 py-3 rounded-xl bg-lavender-50/60">
                  <div>
                    <div className="text-sm font-medium text-ink-900">{l.userId?.name}</div>
                    <div className="text-xs text-ink-500">{l.leaveType} · {l.startDate} → {l.endDate}</div>
                  </div>
                  <StatusBadge status={l.status} />
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card animate-fadeUp">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-ink-900">Employee directory</h2>
            <Link to="/admin/employees" className="text-sm text-lavender-600 font-medium hover:text-lavender-700">
              View all →
            </Link>
          </div>
          <div className="space-y-2">
            {employees.slice(0, 5).map((e: any) => (
              <div key={e._id} className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl hover:bg-lavender-50/60">
                <div className="w-8 h-8 rounded-full bg-lavender-100 text-lavender-700 flex items-center justify-center text-xs font-semibold">
                  {e.name[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-ink-900 truncate">{e.name}</div>
                  <div className="text-xs text-ink-500">{e.employeeId}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Layout>
  );
}

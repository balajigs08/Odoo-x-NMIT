import { useEffect, useState } from "react";
import client from "../../api/client";
import Layout from "../../components/Layout";
import Topbar from "../../components/Topbar";
import { Link } from "react-router-dom";

export default function AdminPayroll() {
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadPayroll() {
    setLoading(true);
    setError("");
    try {
      const res = await client.get("/admin/payroll");
      setRecords(res.data?.records || []);
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to load payroll records.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadPayroll();
  }, []);

  async function downloadSlip(userId: string) {
    if (!userId) return;
    try {
      const res = await client.get(`/reports/salary-slip/${userId}`, { responseType: "blob" });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement("a");
      a.href = url;
      a.download = "salary-slip.pdf";
      a.click();
    } catch (err: any) {
      alert("Could not generate salary slip for this employee.");
    }
  }

  return (
    <Layout>
      <Topbar title="Payroll" subtitle="Salary structures across the team." />

      <div className="card animate-fadeUp">
        {error && (
          <div className="mb-4 px-4 py-3 rounded-xl bg-rose-50 text-rose-700 text-sm border border-rose-200">
            {error}
          </div>
        )}

        {loading ? (
          <p className="text-sm text-ink-500 py-12 text-center animate-pulse">Loading payroll records…</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-ink-500 border-b border-lavender-100">
                  <th className="pb-3 font-medium">Employee</th>
                  <th className="pb-3 font-medium">Basic</th>
                  <th className="pb-3 font-medium">HRA</th>
                  <th className="pb-3 font-medium">Deductions</th>
                  <th className="pb-3 font-medium">Net salary</th>
                  <th className="pb-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {records.map((r: any) => {
                  const empName = r.userId?.name || "Employee";
                  const empId = r.userId?.employeeId ? `(${r.userId.employeeId})` : "";
                  const uId = r.userId?._id || r.userId;
                  const basic = Number(r.basic || 0);
                  const hra = Number(r.hra || 0);
                  const deductions = Number(r.deductions || 0);
                  const netSalary = Number(r.netSalary || basic + hra - deductions);

                  return (
                    <tr key={r._id} className="border-b border-lavender-50 last:border-0 hover:bg-lavender-50/40">
                      <td className="py-3 font-medium text-ink-900">
                        {empName} <span className="text-ink-500 font-normal">{empId}</span>
                      </td>
                      <td className="py-3 text-ink-700">₹{basic.toLocaleString()}</td>
                      <td className="py-3 text-ink-700">₹{hra.toLocaleString()}</td>
                      <td className="py-3 text-rose-600">−₹{deductions.toLocaleString()}</td>
                      <td className="py-3 font-semibold text-ink-900">₹{netSalary.toLocaleString()}</td>
                      <td className="py-3 text-right space-x-3 whitespace-nowrap">
                        {uId && (
                          <button
                            onClick={() => downloadSlip(uId)}
                            className="text-lavender-600 font-medium hover:text-lavender-700 text-xs px-2 py-1 rounded hover:bg-lavender-50"
                          >
                            Download Slip
                          </button>
                        )}
                        {uId && (
                          <Link
                            to={`/admin/employees/${uId}`}
                            className="text-lavender-600 font-medium hover:text-lavender-700 text-xs px-2 py-1"
                          >
                            Edit →
                          </Link>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {records.length === 0 && (
              <p className="text-sm text-ink-500 py-12 text-center">No payroll records found.</p>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
}

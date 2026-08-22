import { useEffect, useState } from "react";
import client from "../../api/client";
import Layout from "../../components/Layout";
import Topbar from "../../components/Topbar";
import { useAuth } from "../../context/AuthContext";

export default function Payroll() {
  const { user } = useAuth();
  const [payroll, setPayroll] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    client.get("/payroll/me").then((res) => {
      setPayroll(res.data.payroll);
      setLoading(false);
    });
  }, []);

  async function downloadSlip() {
    const res = await client.get(`/reports/salary-slip/${user!.id}`, { responseType: "blob" });
    const url = window.URL.createObjectURL(new Blob([res.data]));
    const a = document.createElement("a");
    a.href = url;
    a.download = "salary-slip.pdf";
    a.click();
  }

  return (
    <Layout>
      <Topbar title="Payroll" subtitle="Your current salary structure." />

      <div className="card max-w-xl animate-fadeUp">
        {loading ? (
          <p className="text-sm text-ink-500 py-8 text-center">Loading…</p>
        ) : !payroll ? (
          <p className="text-sm text-ink-500 py-8 text-center">No payroll record on file yet. Contact HR.</p>
        ) : (
          <>
            <div className="flex items-center justify-between mb-6">
              <div>
                <div className="text-sm text-ink-500">Effective date</div>
                <div className="font-medium text-ink-900">{payroll.effectiveDate}</div>
              </div>
              <button onClick={downloadSlip} className="btn-secondary text-sm">
                Download salary slip
              </button>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between px-4 py-3 rounded-xl bg-lavender-50/60">
                <span className="text-sm text-ink-700">Basic</span>
                <span className="text-sm font-medium text-ink-900">₹{payroll.basic.toLocaleString()}</span>
              </div>
              <div className="flex justify-between px-4 py-3 rounded-xl bg-lavender-50/60">
                <span className="text-sm text-ink-700">HRA</span>
                <span className="text-sm font-medium text-ink-900">₹{payroll.hra.toLocaleString()}</span>
              </div>
              <div className="flex justify-between px-4 py-3 rounded-xl bg-rose-50/60">
                <span className="text-sm text-ink-700">Deductions</span>
                <span className="text-sm font-medium text-rose-600">−₹{payroll.deductions.toLocaleString()}</span>
              </div>
              <div className="flex justify-between px-4 py-3.5 rounded-xl bg-lavender-600 text-white">
                <span className="text-sm font-medium">Net salary</span>
                <span className="font-bold">₹{payroll.netSalary.toLocaleString()}</span>
              </div>
            </div>
          </>
        )}
      </div>
    </Layout>
  );
}

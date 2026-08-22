import { useEffect, useState, FormEvent } from "react";
import { useParams } from "react-router-dom";
import client from "../../api/client";
import Layout from "../../components/Layout";
import Topbar from "../../components/Topbar";

export default function AdminEmployeeDetail() {
  const { id } = useParams();
  const [data, setData] = useState<any>(null);
  const [form, setForm] = useState<any>({});
  const [payroll, setPayroll] = useState({ basic: "", hra: "", deductions: "", effectiveDate: "" });
  const [message, setMessage] = useState("");

  async function load() {
    const res = await client.get(`/admin/users/${id}`);
    setData(res.data);
    setForm({
      name: res.data.user.name,
      jobTitle: res.data.profile?.jobTitle || "",
      department: res.data.profile?.department || "",
      phone: res.data.profile?.phone || "",
      address: res.data.profile?.address || "",
    });
  }

  useEffect(() => {
    load();
  }, [id]);

  async function handleSave(e: FormEvent) {
    e.preventDefault();
    await client.patch(`/admin/users/${id}`, form);
    setMessage("Employee details updated.");
    load();
  }

  async function handlePayroll(e: FormEvent) {
    e.preventDefault();
    await client.patch(`/admin/payroll/${id}`, {
      basic: Number(payroll.basic),
      hra: Number(payroll.hra),
      deductions: Number(payroll.deductions),
      effectiveDate: payroll.effectiveDate,
    });
    setMessage("Payroll updated.");
    setPayroll({ basic: "", hra: "", deductions: "", effectiveDate: "" });
  }

  if (!data) {
    return (
      <Layout>
        <Topbar title="Employee" />
        <div className="card text-sm text-ink-500">Loading…</div>
      </Layout>
    );
  }

  return (
    <Layout>
      <Topbar title={data.user.name} subtitle={`${data.user.employeeId} · ${data.user.email}`} />

      {message && (
        <div className="mb-5 px-3.5 py-2.5 rounded-xl bg-emerald-50 text-emerald-700 text-sm border border-emerald-200 animate-fadeUp">
          {message}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card animate-fadeUp">
          <h2 className="font-semibold text-ink-900 mb-4">Edit details</h2>
          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label className="label">Full name</label>
              <input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Job title</label>
                <input className="input" value={form.jobTitle} onChange={(e) => setForm({ ...form, jobTitle: e.target.value })} />
              </div>
              <div>
                <label className="label">Department</label>
                <input className="input" value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} />
              </div>
            </div>
            <div>
              <label className="label">Phone</label>
              <input className="input" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </div>
            <div>
              <label className="label">Address</label>
              <input className="input" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
            </div>
            <button className="btn-primary">Save changes</button>
          </form>
        </div>

        <div className="card animate-fadeUp">
          <h2 className="font-semibold text-ink-900 mb-4">Update payroll</h2>
          <form onSubmit={handlePayroll} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Basic</label>
                <input type="number" required className="input" value={payroll.basic} onChange={(e) => setPayroll({ ...payroll, basic: e.target.value })} />
              </div>
              <div>
                <label className="label">HRA</label>
                <input type="number" required className="input" value={payroll.hra} onChange={(e) => setPayroll({ ...payroll, hra: e.target.value })} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Deductions</label>
                <input type="number" required className="input" value={payroll.deductions} onChange={(e) => setPayroll({ ...payroll, deductions: e.target.value })} />
              </div>
              <div>
                <label className="label">Effective date</label>
                <input type="date" required className="input" value={payroll.effectiveDate} onChange={(e) => setPayroll({ ...payroll, effectiveDate: e.target.value })} />
              </div>
            </div>
            <button className="btn-primary">Update payroll</button>
          </form>
        </div>
      </div>
    </Layout>
  );
}

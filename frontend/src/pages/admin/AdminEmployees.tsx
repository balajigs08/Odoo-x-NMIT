import { useEffect, useState, FormEvent } from "react";
import { Link } from "react-router-dom";
import client from "../../api/client";
import Layout from "../../components/Layout";
import Topbar from "../../components/Topbar";
import { useAuth } from "../../context/AuthContext";

export default function AdminEmployees() {
  const { user: currentUser } = useAuth();
  const [employees, setEmployees] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<"active" | "inactive">("active");
  const [search, setSearch] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [removeModalUser, setRemoveModalUser] = useState<any | null>(null);

  const [form, setForm] = useState({
    employeeId: "",
    name: "",
    email: "",
    department: "",
    designation: "",
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [resendingId, setResendingId] = useState<string | null>(null);

  async function load(q = search, tab = activeTab) {
    try {
      const res = await client.get(`/admin/users?status=${tab}${q ? `&search=${q}` : ""}`);
      setEmployees(res.data.users);
    } catch (_) {}
  }

  useEffect(() => {
    load(search, activeTab);
  }, [activeTab]);

  function handleSearch(e: FormEvent) {
    e.preventDefault();
    load(search, activeTab);
  }

  function updateForm(field: string, val: string) {
    setForm((f) => ({ ...f, [field]: val }));
  }

  async function handleCreateEmployee(e: FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");
    setSubmitting(true);

    try {
      const { data } = await client.post("/admin/users", form);
      setSuccess(data.message || "Employee created. Invitation email sent successfully.");
      setForm({
        employeeId: "",
        name: "",
        email: "",
        department: "",
        designation: "",
      });
      load(search, activeTab);
      setTimeout(() => {
        setShowAddModal(false);
        setSuccess("");
      }, 2500);
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to create employee.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleResendInvitation(id: string) {
    setResendingId(id);
    setError("");
    setSuccess("");
    try {
      const { data } = await client.post(`/admin/users/${id}/resend-invitation`);
      setSuccess(data.message || "Invitation email resent successfully.");
      load(search, activeTab);
      setTimeout(() => setSuccess(""), 4000);
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to resend invitation.");
    } finally {
      setResendingId(null);
    }
  }

  async function handleConfirmRemove() {
    if (!removeModalUser) return;
    setError("");
    setSuccess("");
    setSubmitting(true);
    try {
      const { data } = await client.delete(`/admin/users/${removeModalUser._id}`);
      setSuccess(data.message || "Employee account removed successfully.");
      setRemoveModalUser(null);
      load(search, activeTab);
      setTimeout(() => setSuccess(""), 4000);
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to remove employee.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Layout>
      <Topbar title="Employees" subtitle="Search, onboard, and manage employee records." />

      <div className="card animate-fadeUp">
        {success && (
          <div className="mb-4 px-4 py-3 rounded-xl bg-emerald-50 text-emerald-700 text-sm border border-emerald-200 animate-fadeUp">
            {success}
          </div>
        )}
        {error && (
          <div className="mb-4 px-4 py-3 rounded-xl bg-rose-50 text-rose-700 text-sm border border-rose-200 animate-fadeUp">
            {error}
          </div>
        )}

        {/* Tab Navigation */}
        <div className="flex items-center justify-between border-b border-lavender-100 mb-5 pb-1">
          <div className="flex gap-4">
            <button
              onClick={() => setActiveTab("active")}
              className={`pb-2.5 text-sm font-semibold border-b-2 transition-all ${
                activeTab === "active"
                  ? "border-lavender-600 text-lavender-600"
                  : "border-transparent text-ink-500 hover:text-ink-700"
              }`}
            >
              Active Employees
            </button>
            <button
              onClick={() => setActiveTab("inactive")}
              className={`pb-2.5 text-sm font-semibold border-b-2 transition-all ${
                activeTab === "inactive"
                  ? "border-lavender-600 text-lavender-600"
                  : "border-transparent text-ink-500 hover:text-ink-700"
              }`}
            >
              Inactive Employees
            </button>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
          <form onSubmit={handleSearch} className="w-full sm:w-auto">
            <input
              className="input max-w-sm"
              placeholder="Search by name, email, or employee ID…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </form>

          {activeTab === "active" && (
            <button
              onClick={() => {
                setError("");
                setSuccess("");
                setShowAddModal(true);
              }}
              className="btn-primary flex items-center gap-2 text-sm px-4 py-2.5 rounded-xl font-semibold shadow-soft w-full sm:w-auto justify-center"
            >
              <span>+</span> Add Employee
            </button>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-ink-500 border-b border-lavender-100">
                <th className="pb-3 font-medium">Name</th>
                <th className="pb-3 font-medium">Employee ID</th>
                <th className="pb-3 font-medium">Email</th>
                <th className="pb-3 font-medium">Department</th>
                <th className="pb-3 font-medium">Designation</th>
                <th className="pb-3 font-medium">Status</th>
                <th className="pb-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {employees.map((e) => (
                <tr key={e._id} className="border-b border-lavender-50 last:border-0 hover:bg-lavender-50/40">
                  <td className="py-3.5 flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-lavender-100 text-lavender-700 flex items-center justify-center text-xs font-bold">
                      {e.name ? e.name[0].toUpperCase() : "E"}
                    </div>
                    <div>
                      <span className="font-semibold text-ink-900 block">{e.name}</span>
                      <span className="text-[11px] text-ink-500 uppercase font-medium">
                        {e.role === "ADMIN" ? "HR Admin" : "Employee"}
                      </span>
                    </div>
                  </td>
                  <td className="py-3.5 text-ink-700 font-mono text-xs">{e.employeeId}</td>
                  <td className="py-3.5 text-ink-700">{e.email}</td>
                  <td className="py-3.5 text-ink-700">{e.department || "—"}</td>
                  <td className="py-3.5 text-ink-700">{e.jobTitle || "—"}</td>
                  <td className="py-3.5">
                    {e.status === "inactive" ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                        Deactivated
                      </span>
                    ) : e.invitationStatus === "pending" ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                        Pending Activation
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        Active
                      </span>
                    )}
                  </td>
                  <td className="py-3.5 text-right space-x-2">
                    {e.status !== "inactive" && e.invitationStatus === "pending" && (
                      <button
                        onClick={() => handleResendInvitation(e._id)}
                        disabled={resendingId === e._id}
                        className="text-xs text-lavender-600 hover:text-lavender-800 font-semibold px-2 py-1 rounded hover:bg-lavender-50 transition-all"
                      >
                        {resendingId === e._id ? "Resending…" : "Resend Invite"}
                      </button>
                    )}

                    <Link to={`/admin/employees/${e._id}`} className="text-xs text-ink-600 font-medium hover:text-ink-900 px-2 py-1">
                      View →
                    </Link>

                    {/* Remove Employee button - Available only for non-admin active employees */}
                    {e.status !== "inactive" && e.role !== "ADMIN" && e._id !== currentUser?.id && (
                      <button
                        onClick={() => setRemoveModalUser(e)}
                        className="text-xs text-rose-600 hover:text-rose-800 font-semibold px-2 py-1 rounded hover:bg-rose-50 transition-all border border-rose-200/60"
                      >
                        Remove Employee
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {employees.length === 0 && (
            <p className="text-sm text-ink-500 py-8 text-center">
              No {activeTab} employees found.
            </p>
          )}
        </div>
      </div>

      {/* Confirmation Dialog Modal for Removing Employee */}
      {removeModalUser && (
        <div className="fixed inset-0 bg-ink-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeUp">
          <div className="card w-full max-w-md bg-white p-6 rounded-2xl shadow-2xl relative">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center font-bold text-lg">
                ⚠️
              </div>
              <div>
                <h2 className="text-lg font-bold text-ink-900">Remove Employee?</h2>
                <p className="text-xs text-ink-500">Deactivating account for {removeModalUser.name}</p>
              </div>
            </div>

            <p className="text-sm text-ink-700 mb-6 bg-rose-50/60 p-3.5 rounded-xl border border-rose-100 leading-relaxed">
              Are you sure you want to remove this employee? Their attendance, leave, and payroll history will be preserved.
            </p>

            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setRemoveModalUser(null)}
                className="btn-secondary text-sm px-4 py-2 rounded-xl"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmRemove}
                disabled={submitting}
                className="bg-rose-600 hover:bg-rose-700 text-white text-sm px-5 py-2 rounded-xl font-semibold shadow-soft transition-all"
              >
                {submitting ? "Removing…" : "Remove Employee"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Employee Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-ink-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeUp">
          <div className="card w-full max-w-md bg-white p-6 rounded-2xl shadow-2xl relative">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-bold text-ink-900">Onboard New Employee</h2>
                <p className="text-xs text-ink-500">Send an invitation link to set up their account.</p>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="w-8 h-8 rounded-full bg-lavender-100 text-ink-700 flex items-center justify-center font-bold text-sm hover:bg-lavender-200"
              >
                ✕
              </button>
            </div>

            {error && (
              <div className="mb-4 px-3.5 py-2 rounded-xl bg-rose-50 text-rose-700 text-xs border border-rose-200">
                {error}
              </div>
            )}
            {success && (
              <div className="mb-4 px-3.5 py-2 rounded-xl bg-emerald-50 text-emerald-700 text-xs border border-emerald-200">
                {success}
              </div>
            )}

            <form onSubmit={handleCreateEmployee} className="space-y-3.5">
              <div>
                <label className="label">Employee ID</label>
                <input
                  required
                  className="input"
                  placeholder="EMP-101"
                  value={form.employeeId}
                  onChange={(e) => updateForm("employeeId", e.target.value)}
                />
              </div>

              <div>
                <label className="label">Full Name</label>
                <input
                  required
                  className="input"
                  placeholder="Sarah Connor"
                  value={form.name}
                  onChange={(e) => updateForm("name", e.target.value)}
                />
              </div>

              <div>
                <label className="label">Work Email</label>
                <input
                  type="email"
                  required
                  className="input"
                  placeholder="sarah@dayflow.io"
                  value={form.email}
                  onChange={(e) => updateForm("email", e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Department</label>
                  <input
                    className="input"
                    placeholder="Engineering"
                    value={form.department}
                    onChange={(e) => updateForm("department", e.target.value)}
                  />
                </div>
                <div>
                  <label className="label">Designation</label>
                  <input
                    className="input"
                    placeholder="Software Engineer"
                    value={form.designation}
                    onChange={(e) => updateForm("designation", e.target.value)}
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="btn-secondary text-sm px-4 py-2 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn-primary text-sm px-5 py-2 rounded-xl font-semibold shadow-soft"
                >
                  {submitting ? "Creating…" : "Create Employee"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
}

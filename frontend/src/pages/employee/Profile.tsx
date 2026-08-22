import { useEffect, useState, FormEvent } from "react";
import client from "../../api/client";
import Layout from "../../components/Layout";
import Topbar from "../../components/Topbar";

export default function Profile() {
  const [data, setData] = useState<any>(null);
  const [form, setForm] = useState({ phone: "", address: "" });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  async function load() {
    const res = await client.get("/me");
    setData(res.data);
    setForm({ phone: res.data.profile?.phone || "", address: res.data.profile?.address || "" });
  }

  useEffect(() => {
    load();
  }, []);

  async function handleSave(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage("");
    try {
      await client.patch("/me", form);
      setMessage("Profile updated.");
      load();
    } finally {
      setSaving(false);
    }
  }

  async function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.append("file", file);
    formData.append("type", "profilePicture");
    await client.post("/me/upload", formData, { headers: { "Content-Type": "multipart/form-data" } });
    load();
  }

  if (!data) {
    return (
      <Layout>
        <Topbar title="Profile" />
        <div className="card animate-fadeUp text-sm text-ink-500">Loading…</div>
      </Layout>
    );
  }

  return (
    <Layout>
      <Topbar title="Profile" subtitle="View and update your personal details." />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="card lg:col-span-1 text-center animate-fadeUp">
          <div className="w-24 h-24 rounded-full bg-lavender-100 mx-auto mb-4 flex items-center justify-center overflow-hidden">
            {data.profile?.profilePictureUrl ? (
              <img src={data.profile.profilePictureUrl} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <span className="text-2xl font-bold text-lavender-600">{data.user.name[0]}</span>
            )}
          </div>
          <h2 className="font-semibold text-ink-900">{data.user.name}</h2>
          <p className="text-sm text-ink-500">{data.profile?.jobTitle || "—"}</p>
          <p className="text-xs text-ink-500 mt-1">{data.profile?.department}</p>
          <label className="btn-secondary inline-block mt-4 cursor-pointer text-sm">
            Change photo
            <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
          </label>
        </div>

        <div className="card lg:col-span-2 animate-fadeUp">
          <h2 className="font-semibold text-ink-900 mb-4">Personal details</h2>

          <div className="grid grid-cols-2 gap-4 mb-6">
            <div>
              <div className="text-xs text-ink-500 mb-1">Employee ID</div>
              <div className="text-sm font-medium text-ink-900">{data.user.employeeId}</div>
            </div>
            <div>
              <div className="text-xs text-ink-500 mb-1">Email</div>
              <div className="text-sm font-medium text-ink-900">{data.user.email}</div>
            </div>
          </div>

          {message && (
            <div className="mb-4 px-3.5 py-2.5 rounded-xl bg-emerald-50 text-emerald-700 text-sm border border-emerald-200">
              {message}
            </div>
          )}

          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label className="label">Phone</label>
              <input className="input" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </div>
            <div>
              <label className="label">Address</label>
              <input className="input" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
            </div>
            <button className="btn-primary" disabled={saving}>
              {saving ? "Saving…" : "Save changes"}
            </button>
          </form>
        </div>
      </div>
    </Layout>
  );
}

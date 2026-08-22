import { useState, FormEvent, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import client from "../../api/client";

export default function SignUp() {
  const navigate = useNavigate();
  const [step, setStep] = useState<"details" | "otp">("details");
  const [form, setForm] = useState({
    employeeId: "",
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "ADMIN", // Admin setup ONLY
  });
  const [otp, setOtp] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [countdown, setCountdown] = useState(300);
  const [adminExists, setAdminExists] = useState<boolean | null>(null);

  useEffect(() => {
    client
      .get("/auth/has-admin")
      .then((res) => {
        setAdminExists(!!res.data?.adminExists);
      })
      .catch(() => {
        setAdminExists(false);
      });
  }, []);

  useEffect(() => {
    let timer: any;
    if (step === "otp" && countdown > 0) {
      timer = setInterval(() => setCountdown((c) => c - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [step, countdown]);

  function update(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSendOtp(e: FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (adminExists) {
      return setError("Public registration is disabled because an HR/Admin account already exists.");
    }

    if (form.password !== form.confirmPassword) {
      return setError("Passwords do not match.");
    }
    if (form.password.length < 8) {
      return setError("Password must be at least 8 characters long.");
    }

    setSubmitting(true);
    try {
      const { data } = await client.post("/auth/send-otp", {
        email: form.email,
        purpose: "REGISTRATION",
      });
      setSuccess(data.message || "OTP code sent to your email!");
      setStep("otp");
      setCountdown(300);
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to send OTP. Try again.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleVerifyAndRegister(e: FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");
    setSubmitting(true);
    try {
      const { data } = await client.post("/auth/register", {
        ...form,
        role: "ADMIN",
        otp,
      });
      setSuccess(data.message || "Initial Admin account created successfully!");
      setTimeout(() => navigate("/login"), 2500);
    } catch (err: any) {
      setError(err?.response?.data?.message || "Registration failed. Invalid OTP or user exists.");
    } finally {
      setSubmitting(false);
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  if (adminExists === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-lavender-50 to-white px-4 py-10">
        <div className="text-sm text-ink-500 font-medium animate-pulse">Checking system setup…</div>
      </div>
    );
  }

  // If Admin already exists, PUBLIC REGISTRATION IS CLOSED
  if (adminExists) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-lavender-50 to-white px-4 py-10">
        <div className="w-full max-w-sm animate-fadeUp">
          <div className="flex items-center gap-2.5 justify-center mb-8">
            <Link to="/" className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-lavender-600 flex items-center justify-center text-white font-bold text-lg">
                D
              </div>
              <span className="text-xl font-bold text-ink-900">Dayflow</span>
            </Link>
          </div>

          <div className="card text-center p-6">
            <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold text-2xl mx-auto mb-4">
              🔒
            </div>
            <h1 className="text-xl font-bold text-ink-900 mb-2">Public Registration Closed</h1>
            <p className="text-sm text-ink-500 mb-6 leading-relaxed">
              An HR/Admin account already exists for Dayflow. New employee accounts are onboarded by HR/Admin via invitation email.
            </p>
            <p className="text-xs text-ink-500 mb-6 bg-lavender-50/70 p-3 rounded-xl border border-lavender-100">
              If you received an activation link in your email, please open that link to set your password.
            </p>
            <Link to="/login" className="btn-primary w-full py-2.5 inline-block font-semibold">
              Go to Sign In →
            </Link>
          </div>

          <p className="text-center text-xs text-ink-500 mt-6">
            <Link to="/" className="hover:text-ink-700">← Back to Home</Link>
          </p>
        </div>
      </div>
    );
  }

  // Initial Admin Registration Form (When NO Admin exists)
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-lavender-50 to-white px-4 py-10">
      <div className="w-full max-w-sm animate-fadeUp">
        <div className="flex items-center gap-2.5 justify-center mb-8">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-lavender-600 flex items-center justify-center text-white font-bold text-lg">
              D
            </div>
            <span className="text-xl font-bold text-ink-900">Dayflow</span>
          </Link>
        </div>

        <div className="card">
          <div className="inline-block px-2.5 py-0.5 rounded-full bg-lavender-100 text-lavender-700 text-xs font-semibold mb-2">
            Initial Admin Setup
          </div>
          <h1 className="text-xl font-bold text-ink-900 mb-1">
            {step === "details" ? "Create Admin Account" : "Verify Email OTP"}
          </h1>
          <p className="text-sm text-ink-500 mb-6">
            {step === "details"
              ? "Set up the initial HR/Admin access for your Dayflow HRMS workspace."
              : `Enter the 6-digit verification code sent to ${form.email}`}
          </p>

          {error && (
            <div className="mb-4 px-3.5 py-2.5 rounded-xl bg-rose-50 text-rose-700 text-sm border border-rose-200">
              {error}
            </div>
          )}
          {success && (
            <div className="mb-4 px-3.5 py-2.5 rounded-xl bg-emerald-50 text-emerald-700 text-sm border border-emerald-200">
              {success}
            </div>
          )}

          {step === "details" ? (
            <form onSubmit={handleSendOtp} className="space-y-4">
              <div>
                <label className="label font-medium text-ink-700">Admin ID</label>
                <input
                  required
                  className="input"
                  placeholder="ADM-001"
                  value={form.employeeId}
                  onChange={(e) => update("employeeId", e.target.value)}
                />
              </div>
              <div>
                <label className="label">Full Name</label>
                <input
                  required
                  className="input"
                  placeholder="Jane Doe"
                  value={form.name}
                  onChange={(e) => update("name", e.target.value)}
                />
              </div>
              <div>
                <label className="label">Official Email</label>
                <input
                  type="email"
                  required
                  className="input"
                  placeholder="admin@dayflow.io"
                  value={form.email}
                  onChange={(e) => update("email", e.target.value)}
                />
              </div>
              <div>
                <label className="label">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    className="input pr-10"
                    placeholder="At least 8 chars (1 upper, 1 number)"
                    value={form.password}
                    onChange={(e) => update("password", e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-xs text-ink-500 hover:text-ink-700 font-medium"
                  >
                    {showPassword ? "Hide" : "Show"}
                  </button>
                </div>
              </div>
              <div>
                <label className="label">Confirm Password</label>
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  className="input"
                  placeholder="Repeat password"
                  value={form.confirmPassword}
                  onChange={(e) => update("confirmPassword", e.target.value)}
                />
              </div>
              <button type="submit" disabled={submitting} className="btn-primary w-full mt-2 py-2.5 font-semibold">
                {submitting ? "Sending OTP…" : "Send OTP Verification"}
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifyAndRegister} className="space-y-4">
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="label mb-0">6-Digit OTP</label>
                  <span className="text-xs text-lavender-600 font-medium">
                    Expires in {formatTime(countdown)}
                  </span>
                </div>
                <input
                  type="text"
                  maxLength={6}
                  required
                  className="input text-center text-lg font-mono tracking-widest"
                  placeholder="123456"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                />
              </div>

              <button
                type="submit"
                disabled={submitting || otp.length !== 6}
                className="btn-primary w-full mt-2 py-2.5 font-semibold"
              >
                {submitting ? "Creating Admin Account…" : "Verify OTP & Create Admin Account"}
              </button>

              <div className="flex justify-between items-center pt-2">
                <button
                  type="button"
                  onClick={() => setStep("details")}
                  className="text-xs text-ink-500 hover:text-ink-700 font-medium"
                >
                  ← Edit Details
                </button>
                <button
                  type="button"
                  onClick={handleSendOtp}
                  disabled={countdown > 270}
                  className="text-xs text-lavender-600 hover:text-lavender-700 font-medium disabled:opacity-50"
                >
                  Resend OTP
                </button>
              </div>
            </form>
          )}
        </div>

        <p className="text-center text-sm text-ink-500 mt-6">
          Already have an account?{" "}
          <Link to="/login" className="text-lavender-600 font-semibold hover:text-lavender-700">
            Sign In
          </Link>
        </p>

        <p className="text-center text-xs text-ink-500 mt-4">
          <Link to="/" className="hover:text-ink-700">← Back to Home</Link>
        </p>
      </div>
    </div>
  );
}

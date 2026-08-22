import { useState, FormEvent } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import client from "../../api/client";

export default function ActivateAccount() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") || "";
  const navigate = useNavigate();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleActivate(e: FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!token) {
      return setError("Missing activation token. Please check your email link.");
    }

    if (password.length < 8) {
      return setError("Password must be at least 8 characters long.");
    }

    if (password !== confirmPassword) {
      return setError("Passwords do not match.");
    }

    setSubmitting(true);
    try {
      const { data } = await client.post("/auth/activate-account", {
        token,
        password,
      });

      setSuccess(data.message || "Account activated successfully!");
      setTimeout(() => {
        navigate("/login");
      }, 3000);
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to activate account. Invalid or expired token.");
    } finally {
      setSubmitting(false);
    }
  }

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

        <div className="card shadow-card">
          <h1 className="text-xl font-bold text-ink-900 mb-1">Activate Employee Account</h1>
          <p className="text-sm text-ink-500 mb-6">
            Welcome! Set your new password to complete your account setup.
          </p>

          {error && (
            <div className="mb-4 px-3.5 py-2.5 rounded-xl bg-rose-50 text-rose-700 text-sm border border-rose-200 animate-fadeUp">
              {error}
            </div>
          )}

          {success && (
            <div className="mb-4 px-3.5 py-2.5 rounded-xl bg-emerald-50 text-emerald-700 text-sm border border-emerald-200 animate-fadeUp">
              {success}
              <div className="mt-2 text-xs font-semibold">Redirecting to Sign In...</div>
            </div>
          )}

          {!success && (
            <form onSubmit={handleActivate} className="space-y-4">
              <div>
                <label className="label">New Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    className="input pr-10"
                    placeholder="At least 8 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
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
                <label className="label">Confirm New Password</label>
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  className="input"
                  placeholder="Re-enter password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="btn-primary w-full mt-2 py-2.5 font-semibold"
              >
                {submitting ? "Activating Account…" : "Activate Account & Save Password"}
              </button>
            </form>
          )}
        </div>

        <p className="text-center text-sm text-ink-500 mt-6">
          Already activated?{" "}
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

import { useState, FormEvent, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { initiateGoogleLogin } from "../../utils/googleAuth";
import client from "../../api/client";

export default function SignIn() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [adminExists, setAdminExists] = useState(true);

  useEffect(() => {
    client
      .get("/auth/has-admin")
      .then((res) => {
        setAdminExists(!!res.data?.adminExists);
      })
      .catch(() => {});
  }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const user = await login(email, password);
      navigate(user.role === "ADMIN" ? "/hr/dashboard" : "/employee/dashboard");
    } catch (err: any) {
      setError(err?.response?.data?.message || "Incorrect email or password. Try again.");
    } finally {
      setSubmitting(false);
    }
  }

  function handleGoogleLogin() {
    setError("");
    initiateGoogleLogin(setError, setSubmitting);
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

        <div className="card">
          <h1 className="text-xl font-bold text-ink-900 mb-1">Welcome to Dayflow</h1>
          <p className="text-sm text-ink-500 mb-6">Sign in to your HR workspace.</p>

          {error && (
            <div className="mb-4 px-3.5 py-2.5 rounded-xl bg-rose-50 text-rose-700 text-sm border border-rose-200 animate-fadeUp">
              {error}
            </div>
          )}

          {!adminExists && (
            <div className="mb-4 p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-800">
              <div className="font-bold mb-1">No HR/Admin Account Found</div>
              Dayflow setup requires an initial HR/Admin account.
              <div className="mt-2">
                <Link
                  to="/signup"
                  className="btn-primary text-xs px-3 py-1.5 rounded-lg font-semibold inline-block"
                >
                  Create Initial Admin Account →
                </Link>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Email</label>
              <input
                type="email"
                required
                className="input"
                placeholder="you@dayflow.io"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="label mb-0">Password</label>
                <Link to="/forgot-password" className="text-xs text-lavender-600 font-medium hover:text-lavender-700">
                  Forgot Password?
                </Link>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  className="input pr-10"
                  placeholder="••••••••"
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

            <button type="submit" disabled={submitting} className="btn-primary w-full mt-2 py-2.5 font-semibold">
              {submitting ? "Signing in…" : "Sign In"}
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-6 text-center">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-lavender-200/80" />
            </div>
            <span className="relative bg-white px-3 text-xs text-ink-500 font-medium uppercase tracking-wider">
              OR
            </span>
          </div>

          {/* Google Sign In Button */}
          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={submitting}
            className="w-full flex items-center justify-center gap-3 px-4 py-2.5 rounded-xl border border-lavender-200 bg-white text-ink-900 font-medium text-sm hover:bg-lavender-50 active:scale-[0.98] transition-all"
          >
            <svg width="18" height="18" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            Continue with Google
          </button>
        </div>

        {/* Show Admin Signup link ONLY when no Admin exists */}
        {!adminExists && (
          <p className="text-center text-sm text-ink-500 mt-6">
            Initial setup?{" "}
            <Link to="/signup" className="text-lavender-600 font-semibold hover:text-lavender-700">
              Create Admin Account
            </Link>
          </p>
        )}

        <p className="text-center text-xs text-ink-500 mt-4">
          <Link to="/" className="hover:text-ink-700">← Back to Home</Link>
        </p>
      </div>
    </div>
  );
}

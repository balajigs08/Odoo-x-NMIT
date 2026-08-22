import { useState, FormEvent, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import client from "../../api/client";

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [step, setStep] = useState<"email" | "otp">("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(300); // 5 min timer

  useEffect(() => {
    let timer: any;
    if (step === "otp" && countdown > 0) {
      timer = setInterval(() => setCountdown((c) => c - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [step, countdown]);

  async function handleSendOtp(e: FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);
    try {
      const { data } = await client.post("/auth/forgot-password", { email });
      setSuccess(data.message || "OTP code sent to your email!");
      setStep("otp");
      setCountdown(300);
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to send OTP. Please check your email address.");
    } finally {
      setLoading(false);
    }
  }

  async function handleResetPassword(e: FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);
    try {
      const { data } = await client.post("/auth/reset-password", { email, otp, newPassword });
      setSuccess(data.message);
      setTimeout(() => navigate("/login"), 2500);
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to reset password. Check your OTP and try again.");
    } finally {
      setLoading(false);
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-lavender-50 to-white px-4 py-10">
      <div className="w-full max-w-sm animate-fadeUp">
        <div className="flex items-center gap-2.5 justify-center mb-8">
          <div className="w-10 h-10 rounded-xl bg-lavender-600 flex items-center justify-center text-white font-bold text-lg">
            D
          </div>
          <span className="text-xl font-bold text-ink-900">Dayflow</span>
        </div>

        <div className="card">
          <h1 className="text-xl font-bold text-ink-900 mb-1">
            {step === "email" ? "Reset Password" : "Enter Verification OTP"}
          </h1>
          <p className="text-sm text-ink-500 mb-6">
            {step === "email"
              ? "Enter your account email to receive a 6-digit verification code."
              : `We sent a 6-digit OTP code to ${email}.`}
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

          {step === "email" ? (
            <form onSubmit={handleSendOtp} className="space-y-4">
              <div>
                <label className="label">Email address</label>
                <input
                  type="email"
                  required
                  className="input"
                  placeholder="you@dayflow.io"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <button type="submit" disabled={loading} className="btn-primary w-full mt-2">
                {loading ? "Sending OTP…" : "Send Verification OTP"}
              </button>
            </form>
          ) : (
            <form onSubmit={handleResetPassword} className="space-y-4">
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

              <div>
                <label className="label">New Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    className="input pr-10"
                    placeholder="At least 8 chars (1 upper, 1 number)"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
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

              <button type="submit" disabled={loading || otp.length !== 6} className="btn-primary w-full mt-2">
                {loading ? "Resetting…" : "Reset Password & Sign In"}
              </button>

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={handleSendOtp}
                  disabled={countdown > 270}
                  className="text-xs text-lavender-600 hover:text-lavender-700 font-medium disabled:opacity-50"
                >
                  Resend OTP Code
                </button>
              </div>
            </form>
          )}
        </div>

        <div className="text-center text-sm text-ink-500 mt-6 space-y-2">
          <div>
            Remembered your password?{" "}
            <Link to="/login" className="text-lavender-600 font-medium hover:text-lavender-700">
              Sign In
            </Link>
          </div>
          <div>
            <Link to="/" className="text-xs text-ink-500 hover:text-ink-700">
              ← Back to Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

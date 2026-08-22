import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import client from "../../api/client";

export default function VerifyEmail() {
  const [params] = useSearchParams();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const token = params.get("token");
    if (!token) {
      setStatus("error");
      setMessage("No verification token found in the link.");
      return;
    }
    client
      .get(`/auth/verify-email?token=${token}`)
      .then((res) => {
        setStatus("success");
        setMessage(res.data.message);
      })
      .catch((err) => {
        setStatus("error");
        setMessage(err?.response?.data?.message || "Verification failed.");
      });
  }, [params]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-lavender-50 to-white px-4">
      <div className="card w-full max-w-sm text-center animate-fadeUp">
        <div className="w-12 h-12 rounded-full bg-lavender-100 text-lavender-700 flex items-center justify-center mx-auto mb-4">
          {status === "success" ? "✓" : status === "error" ? "!" : "…"}
        </div>
        <h1 className="text-lg font-bold text-ink-900 mb-1">
          {status === "loading" ? "Verifying…" : status === "success" ? "Email verified" : "Verification failed"}
        </h1>
        <p className="text-sm text-ink-500 mb-6">{message}</p>
        <Link to="/sign-in" className="btn-primary w-full inline-block">
          Go to sign in
        </Link>
      </div>
    </div>
  );
}

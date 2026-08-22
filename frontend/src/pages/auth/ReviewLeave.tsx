import { useEffect, useState } from "react";
import { useSearchParams, Link, useNavigate } from "react-router-dom";
import client from "../../api/client";
import { useAuth } from "../../context/AuthContext";

export default function ReviewLeave() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") || "";
  const { user } = useAuth();
  const navigate = useNavigate();

  const [leave, setLeave] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [comment, setComment] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!token) {
      setError("No leave review token provided.");
      setLoading(false);
      return;
    }

    client
      .get(`/auth/leave-review-info?token=${token}`)
      .then((res) => {
        setLeave(res.data.leave);
      })
      .catch((err) => {
        setError(err?.response?.data?.message || "Invalid, expired, or already used review link.");
      })
      .finally(() => {
        setLoading(false);
      });
  }, [token]);

  async function handleReview(status: "APPROVED" | "REJECTED") {
    setError("");
    setSuccess("");

    // If Admin is not logged in, prompt or allow token-based approval
    if (!user) {
      // Prompt user or redirect to login returning back
      const returnUrl = encodeURIComponent(`/review-leave?token=${token}`);
      navigate(`/login?redirectTo=${returnUrl}`);
      return;
    }

    if (user.role !== "ADMIN") {
      return setError("Only HR/Admin users can review leave requests.");
    }

    setSubmitting(true);
    try {
      const { data } = await client.post("/auth/review-leave", {
        token,
        status,
        reviewerComment: comment,
      });

      setSuccess(data.message || `Leave request ${status.toLowerCase()} successfully.`);
      setLeave(data.leave);
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to process leave review.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-lavender-50 to-white px-4 py-10">
      <div className="w-full max-w-lg animate-fadeUp">
        <div className="flex items-center gap-2.5 justify-center mb-8">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-lavender-600 flex items-center justify-center text-white font-bold text-lg">
              D
            </div>
            <span className="text-xl font-bold text-ink-900">Dayflow</span>
          </Link>
        </div>

        <div className="card shadow-card">
          <div className="inline-block px-2.5 py-0.5 rounded-full bg-lavender-100 text-lavender-700 text-xs font-semibold mb-3">
            HR Leave Review
          </div>
          <h1 className="text-xl font-bold text-ink-900 mb-1">Review Leave Request</h1>
          <p className="text-sm text-ink-500 mb-6">
            Direct website approval portal for employee leave requests.
          </p>

          {error && (
            <div className="mb-4 px-4 py-3 rounded-xl bg-rose-50 text-rose-700 text-sm border border-rose-200">
              {error}
            </div>
          )}

          {success && (
            <div className="mb-4 px-4 py-3 rounded-xl bg-emerald-50 text-emerald-700 text-sm border border-emerald-200 font-medium">
              {success}
            </div>
          )}

          {loading ? (
            <p className="text-sm text-ink-500 py-12 text-center animate-pulse">
              Loading leave request details…
            </p>
          ) : leave ? (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-lavender-50/70 border border-lavender-100 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-ink-500 font-medium uppercase">Employee</span>
                  <span className="text-xs font-mono bg-white px-2 py-0.5 rounded border border-lavender-200 font-semibold text-ink-700">
                    {leave.userId?.employeeId}
                  </span>
                </div>
                <div className="text-base font-bold text-ink-900">{leave.userId?.name}</div>
                <div className="text-xs text-ink-500">{leave.userId?.email}</div>

                <hr className="border-lavender-200/60 my-2" />

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-ink-500 block">Leave Type</span>
                    <span className="font-semibold text-ink-900">{leave.leaveType}</span>
                  </div>
                  <div>
                    <span className="text-ink-500 block">Duration</span>
                    <span className="font-semibold text-ink-900">
                      {leave.startDate} → {leave.endDate}
                    </span>
                  </div>
                </div>

                {leave.remarks && (
                  <div className="pt-2">
                    <span className="text-xs text-ink-500 block">Employee Reason</span>
                    <p className="text-xs text-ink-700 italic bg-white p-2.5 rounded-lg border border-lavender-100 mt-1">
                      "{leave.remarks}"
                    </p>
                  </div>
                )}
              </div>

              {leave.status === "PENDING" ? (
                <div className="space-y-3 pt-2">
                  <div>
                    <label className="label">HR Reviewer Comment (Optional)</label>
                    <input
                      className="input"
                      placeholder="Add an approval or rejection note…"
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => handleReview("REJECTED")}
                      disabled={submitting}
                      className="py-2.5 rounded-xl border border-rose-300 text-rose-700 font-semibold text-sm hover:bg-rose-50 transition-all"
                    >
                      Reject Request
                    </button>
                    <button
                      type="button"
                      onClick={() => handleReview("APPROVED")}
                      disabled={submitting}
                      className="btn-primary py-2.5 font-semibold text-sm shadow-soft"
                    >
                      Approve Request
                    </button>
                  </div>
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-white border border-lavender-200 text-center">
                  <span className="text-xs text-ink-500 block mb-1">Current Request Status</span>
                  <span
                    className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${
                      leave.status === "APPROVED"
                        ? "bg-emerald-100 text-emerald-800"
                        : "bg-rose-100 text-rose-800"
                    }`}
                  >
                    {leave.status}
                  </span>
                  {leave.reviewerComment && (
                    <p className="text-xs text-ink-600 mt-2">Note: {leave.reviewerComment}</p>
                  )}
                </div>
              )}
            </div>
          ) : null}
        </div>

        <p className="text-center text-xs text-ink-500 mt-6">
          <Link to="/hr/dashboard" className="hover:text-ink-700 font-medium">
            ← Go to HR Dashboard
          </Link>
        </p>
      </div>
    </div>
  );
}

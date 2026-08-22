import { Link } from "react-router-dom";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-lavender-50 via-white to-lavender-50/30 flex flex-col justify-between font-sans">
      {/* Navigation Bar */}
      <header className="max-w-6xl w-full mx-auto px-6 py-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-lavender-600 flex items-center justify-center text-white font-extrabold text-lg shadow-soft">
            D
          </div>
          <div>
            <span className="text-2xl font-extrabold text-ink-900 tracking-tight">Dayflow</span>
            <span className="hidden sm:inline-block ml-2.5 text-xs bg-lavender-100 text-lavender-700 px-2.5 py-0.5 rounded-full font-semibold">
              HRMS
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/login"
            className="btn-primary shadow-soft text-sm px-5 py-2.5 rounded-xl font-semibold"
          >
            Sign In
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-5xl w-full mx-auto px-6 py-12 md:py-20 text-center flex-1 flex flex-col justify-center items-center">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-lavender-100/80 text-lavender-700 text-sm font-medium mb-6 animate-fadeUp">
          <span className="w-2 h-2 rounded-full bg-lavender-600 animate-pulse" />
          Modern Human Resource Management System
        </div>

        <h1 className="text-4xl sm:text-6xl font-extrabold text-ink-900 leading-tight tracking-tight max-w-3xl mb-6 animate-fadeUp">
          Every workday, <br />
          <span className="bg-gradient-to-r from-lavender-600 to-lavender-400 bg-clip-text text-transparent">
            perfectly aligned.
          </span>
        </h1>

        <p className="text-lg sm:text-xl text-ink-500 max-w-2xl mb-10 leading-relaxed animate-fadeUp">
          Dayflow streamlines workforce operations with role-based dashboards for employees and HR teams — 
          attendance tracking, leave approvals, payroll management, and analytics in one place.
        </p>

        <div className="flex flex-col sm:flex-row items-center gap-4 mb-16 animate-fadeUp">
          <Link
            to="/login"
            className="btn-primary text-base px-8 py-3.5 rounded-xl font-semibold shadow-soft hover:scale-[1.02] active:scale-[0.98] transition-all w-full sm:w-auto"
          >
            Sign In to Workspace →
          </Link>
        </div>

        {/* Feature Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full text-left mt-8">
          <div className="card card-hover p-6 border border-lavender-200/80 rounded-2xl bg-white shadow-card">
            <div className="w-12 h-12 rounded-xl bg-lavender-100 text-lavender-700 flex items-center justify-center font-bold text-xl mb-4">
              👥
            </div>
            <h3 className="text-lg font-bold text-ink-900 mb-2">Employee Management</h3>
            <p className="text-sm text-ink-500 leading-relaxed">
              Centralized profiles, job details, contact info, and role-based permissions for every team member.
            </p>
          </div>

          <div className="card card-hover p-6 border border-lavender-200/80 rounded-2xl bg-white shadow-card">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold text-xl mb-4">
              ⏱️
            </div>
            <h3 className="text-lg font-bold text-ink-900 mb-2">Attendance Tracking</h3>
            <p className="text-sm text-ink-500 leading-relaxed">
              One-click daily check-in and check-out, working hours calculation, and weekly attendance logs.
            </p>
          </div>

          <div className="card card-hover p-6 border border-lavender-200/80 rounded-2xl bg-white shadow-card">
            <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center font-bold text-xl mb-4">
              🌴
            </div>
            <h3 className="text-lg font-bold text-ink-900 mb-2">Leave Management</h3>
            <p className="text-sm text-ink-500 leading-relaxed">
              Apply for paid or sick leaves, track balances, and receive instant HR review approvals.
            </p>
          </div>

          <div className="card card-hover p-6 border border-lavender-200/80 rounded-2xl bg-white shadow-card md:col-span-1 lg:col-span-1">
            <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center font-bold text-xl mb-4">
              💼
            </div>
            <h3 className="text-lg font-bold text-ink-900 mb-2">Payroll Visibility</h3>
            <p className="text-sm text-ink-500 leading-relaxed">
              Clear breakdown of basic salary, HRA, deductions, and downloadable PDF payslips.
            </p>
          </div>

          <div className="card card-hover p-6 border border-lavender-200/80 rounded-2xl bg-white shadow-card md:col-span-2 lg:col-span-2">
            <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-700 flex items-center justify-center font-bold text-xl mb-4">
              ⚡
            </div>
            <h3 className="text-lg font-bold text-ink-900 mb-2">HR Approval Workflows</h3>
            <p className="text-sm text-ink-500 leading-relaxed">
              Automated notifications, organizational analytics, and employee record management for HR leaders.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-lavender-100 py-6 text-center text-sm text-ink-500 bg-white">
        <div className="max-w-6xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div>© {new Date().getFullYear()} Dayflow HRMS. All rights reserved.</div>
          <div className="flex gap-4">
            <Link to="/login" className="hover:text-lavender-700 font-medium">Sign In</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

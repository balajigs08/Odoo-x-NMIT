import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const employeeLinks = [
  { to: "/employee/dashboard", label: "Dashboard", icon: "grid" },
  { to: "/profile", label: "Profile", icon: "user" },
  { to: "/attendance", label: "Attendance", icon: "clock" },
  { to: "/leave", label: "Leave", icon: "calendar" },
  { to: "/payroll", label: "Payroll", icon: "wallet" },
];

const adminLinks = [
  { to: "/hr/dashboard", label: "Dashboard", icon: "grid" },
  { to: "/admin/employees", label: "Employees", icon: "users" },
  { to: "/admin/attendance", label: "Attendance", icon: "clock" },
  { to: "/admin/leave", label: "Leave Approvals", icon: "calendar" },
  { to: "/admin/payroll", label: "Payroll", icon: "wallet" },
  { to: "/admin/reports", label: "Reports", icon: "chart" },
];

const icons: Record<string, JSX.Element> = {
  grid: <path d="M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z" />,
  user: <path d="M12 12a4 4 0 100-8 4 4 0 000 8zM4 21a8 8 0 0116 0" />,
  clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 3" /></>,
  calendar: <><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M8 3v4M16 3v4M3 10h18" /></>,
  wallet: <><rect x="3" y="6" width="18" height="13" rx="2" /><path d="M3 10h18M16 14h2" /></>,
  users: <><circle cx="9" cy="8" r="3" /><path d="M2 20a7 7 0 0114 0" /><circle cx="17" cy="9" r="2.5" /><path d="M16 20a5 5 0 016-4.5" /></>,
  chart: <><path d="M4 20V10M10 20V4M16 20v-7M22 20H2" /></>,
};

export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const links = user?.role === "ADMIN" ? adminLinks : employeeLinks;

  function handleLogout() {
    logout();
    navigate("/"); // Requirement: Logout MUST redirect to Landing Page (/)
  }

  return (
    <aside className="w-64 shrink-0 h-screen sticky top-0 bg-white border-r border-lavender-100 flex flex-col">
      <div className="px-6 py-6 flex items-center gap-2.5">
        <div className="w-9 h-9 rounded-xl bg-lavender-600 flex items-center justify-center text-white font-bold text-sm">
          D
        </div>
        <div>
          <div className="font-bold text-ink-900 leading-tight">Dayflow</div>
          <div className="text-[11px] text-ink-500 leading-tight">Every workday, aligned</div>
        </div>
      </div>

      <nav className="flex-1 px-3 py-2 space-y-1">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            end={link.to === "/hr/dashboard" || link.to === "/employee/dashboard" || link.to === "/dashboard" || link.to === "/admin"}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
                isActive
                  ? "bg-lavender-100 text-lavender-700"
                  : "text-ink-700 hover:bg-lavender-50"
              }`
            }
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              {icons[link.icon]}
            </svg>
            {link.label}
          </NavLink>
        ))}
      </nav>

      <div className="p-3 border-t border-lavender-100">
        <div className="px-3 py-2 mb-1">
          <div className="text-sm font-medium text-ink-900 truncate">{user?.name}</div>
          <div className="text-xs text-ink-500 truncate">{user?.email}</div>
          <div className="text-[10px] text-lavender-600 font-bold uppercase mt-0.5">
            {user?.role === "ADMIN" ? "HR Admin" : "Employee"}
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium text-ink-700 hover:bg-rose-50 hover:text-rose-600 transition-colors"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
            <path d="M16 17l5-5-5-5M21 12H9" />
          </svg>
          Log out
        </button>
      </div>
    </aside>
  );
}

import { NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function AdminSidebar() {
  const { logout } = useAuth();

  const linkClass = ({ isActive }) =>
    `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
      isActive
        ? "bg-primary-container text-on-primary-container shadow-sm"
        : "text-on-surface-variant hover:bg-surface-container hover:text-on-surface"
    }`;

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-surface border-r border-outline-variant z-40 flex flex-col">
      <div className="p-5 border-b border-outline-variant">
        <h1 className="text-lg font-bold text-primary">JAPA Admin</h1>
        <p className="text-xs text-on-surface-variant mt-0.5">Control Panel</p>
      </div>

      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        <NavLink to="/admin" end className={linkClass}>
          <span className="material-symbols-outlined text-xl">dashboard</span>
          Overview
        </NavLink>
        <NavLink to="/admin/analytics" className={linkClass}>
          <span className="material-symbols-outlined text-xl">analytics</span>
          User Analytics
        </NavLink>
        <NavLink to="/admin/scrapers" className={linkClass}>
          <span className="material-symbols-outlined text-xl">rss_feed</span>
          Scraper Manager
        </NavLink>
      </nav>

      <div className="p-3 border-t border-outline-variant">
        <NavLink to="/discovery" className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-on-surface-variant hover:bg-surface-container transition-colors">
          <span className="material-symbols-outlined text-xl">arrow_back</span>
          Back to App
        </NavLink>
        <button
          onClick={logout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-error hover:bg-error-container/20 transition-colors mt-1"
        >
          <span className="material-symbols-outlined text-xl">logout</span>
          Sign Out
        </button>
      </div>
    </aside>
  );
}

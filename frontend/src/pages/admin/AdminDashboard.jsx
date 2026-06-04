import { useState, useEffect } from "react";
import AdminSidebar from "../../components/AdminSidebar";
import { adminApi } from "../../api/admin";

export default function AdminDashboard() {
  const [overview, setOverview] = useState(null);
  const [activity, setActivity] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([adminApi.overview(), adminApi.activity()])
      .then(([ov, act]) => {
        setOverview(ov);
        setActivity(act.recentActivity || act);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const stats = overview
    ? [
        { label: "Total Users", value: overview.users, icon: "people", color: "bg-blue-500/10 text-blue-600" },
        { label: "Applications", value: overview.applications, icon: "description", color: "bg-emerald-500/10 text-emerald-600" },
        { label: "Documents", value: overview.documents, icon: "folder", color: "bg-amber-500/10 text-amber-600" },
      ]
    : [];

  const quickActions = [
    { label: "View Analytics", to: "/admin/analytics", icon: "analytics" },
    { label: "Manage Scrapers", to: "/admin/scrapers", icon: "rss_feed" },
  ];

  return (
    <div className="bg-surface font-body-md text-body-md text-on-surface min-h-screen flex">
      <AdminSidebar />
      <main className="flex-1 md:ml-64 p-6">
        <header className="mb-8">
          <h2 className="text-2xl font-bold text-primary mb-1">Super Admin Dashboard</h2>
          <p className="text-on-surface-variant">Monitor platform activity and manage resources.</p>
        </header>

        {loading ? (
          <p className="text-on-surface-variant">Loading dashboard...</p>
        ) : (
          <>
            <section className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              {stats.map((s) => (
                <div key={s.label} className="bg-surface-container-lowest rounded-xl border border-surface-container p-5 flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${s.color}`}>
                    <span className="material-symbols-outlined text-2xl">{s.icon}</span>
                  </div>
                  <div>
                    <p className="text-sm text-on-surface-variant">{s.label}</p>
                    <p className="text-2xl font-bold text-primary">{s.value}</p>
                  </div>
                </div>
              ))}
            </section>

            <section className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
              {quickActions.map((a) => (
                <a
                  key={a.label}
                  href={a.to}
                  className="bg-surface-container-lowest rounded-xl border border-surface-container p-5 flex items-center gap-4 hover:shadow-md transition-shadow"
                >
                  <div className="w-12 h-12 rounded-xl bg-primary-container text-on-primary-container flex items-center justify-center">
                    <span className="material-symbols-outlined text-2xl">{a.icon}</span>
                  </div>
                  <span className="font-medium text-primary">{a.label}</span>
                </a>
              ))}
            </section>

            <section className="bg-surface-container-lowest rounded-xl border border-surface-container p-5">
              <h3 className="text-lg font-semibold text-primary mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined">history</span>
                Recent Activity
              </h3>
              {activity.length === 0 ? (
                <p className="text-on-surface-variant text-sm">No recent activity.</p>
              ) : (
                <div className="space-y-3">
                  {activity.slice(0, 8).map((log, i) => (
                    <div key={log.id || i} className="flex items-center gap-3 pb-3 border-b border-outline-variant last:border-0">
                      <div className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center shrink-0">
                        <span className="material-symbols-outlined text-lg text-on-surface-variant">circle</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-on-surface truncate">{log.details || log.action}</p>
                        <p className="text-xs text-on-surface-variant">{new Date(log.createdAt).toLocaleString()}</p>
                      </div>
                      <span className="text-xs bg-surface-container-high px-2 py-1 rounded text-on-surface-variant">{log.resource}</span>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </>
        )}
      </main>
    </div>
  );
}

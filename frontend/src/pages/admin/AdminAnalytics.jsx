import { useState, useEffect } from "react";
import AdminSidebar from "../../components/AdminSidebar";
import { adminApi } from "../../api/admin";

export default function AdminAnalytics() {
  const [growth, setGrowth] = useState([]);
  const [users, setUsers] = useState([]);
  const [hotspots, setHotspots] = useState([]);
  const [successRate, setSuccessRate] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      adminApi.analyticsGrowth(),
      adminApi.analyticsUsers(),
      adminApi.analyticsHotspots(),
      adminApi.analyticsSuccessRate(),
    ])
      .then(([g, u, h, sr]) => {
        setGrowth(g);
        setUsers(u);
        setHotspots(h);
        setSuccessRate(sr);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const maxUsers = Math.max(...growth.map((g) => g.data.users), 1);
  const maxApps = Math.max(...growth.map((g) => g.data.applications), 1);

  return (
    <div className="bg-surface font-body-md text-body-md text-on-surface min-h-screen flex">
      <AdminSidebar />
      <main className="flex-1 md:ml-64 p-6">
        <header className="mb-8">
          <h2 className="text-2xl font-bold text-primary mb-1">User Analytics Dashboard</h2>
          <p className="text-on-surface-variant">Track user growth, demographics, and application success rates.</p>
        </header>

        {loading ? (
          <p className="text-on-surface-variant">Loading analytics...</p>
        ) : (
          <>
            {successRate && (
              <section className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                <div className="bg-surface-container-lowest rounded-xl border border-surface-container p-5">
                  <p className="text-sm text-on-surface-variant mb-1">Total Users</p>
                  <p className="text-3xl font-bold text-primary">{users.length}+</p>
                </div>
                <div className="bg-surface-container-lowest rounded-xl border border-surface-container p-5">
                  <p className="text-sm text-on-surface-variant mb-1">Applications Filed</p>
                  <p className="text-3xl font-bold text-primary">{successRate.total}</p>
                </div>
                <div className="bg-surface-container-lowest rounded-xl border border-surface-container p-5">
                  <p className="text-sm text-on-surface-variant mb-1">Success Rate</p>
                  <p className="text-3xl font-bold text-emerald-600">{successRate.rate}%</p>
                </div>
              </section>
            )}

            <section className="bg-surface-container-lowest rounded-xl border border-surface-container p-5 mb-6">
              <h3 className="text-lg font-semibold text-primary mb-4">Growth Overview</h3>
              <div className="flex gap-8 mb-4">
                <label className="flex items-center gap-2 text-sm text-on-surface-variant">
                  <input type="checkbox" defaultChecked className="accent-primary" /> Users
                </label>
                <label className="flex items-center gap-2 text-sm text-on-surface-variant">
                  <input type="checkbox" defaultChecked className="accent-secondary" /> Applications
                </label>
              </div>
              <div className="relative h-48">
                <svg viewBox={`0 0 ${growth.length * 60 + 40} 200`} className="w-full h-full">
                  {growth.map((g, i) => {
                    const x = i * 60 + 40;
                    const uy = 170 - (g.data.users / maxUsers) * 150;
                    const ay = 170 - (g.data.applications / maxApps) * 150;
                    return (
                      <g key={i}>
                        {i > 0 && (
                          <>
                            <line
                              x1={(i - 1) * 60 + 40}
                              y1={170 - (growth[i - 1].data.users / maxUsers) * 150}
                              x2={x}
                              y2={uy}
                              stroke="#2563eb"
                              strokeWidth="2"
                            />
                            <line
                              x1={(i - 1) * 60 + 40}
                              y1={170 - (growth[i - 1].data.applications / maxApps) * 150}
                              x2={x}
                              y2={ay}
                              stroke="#7c3aed"
                              strokeWidth="2"
                            />
                          </>
                        )}
                        <circle cx={x} cy={uy} r="4" fill="#2563eb" />
                        <circle cx={x} cy={ay} r="4" fill="#7c3aed" />
                        <text x={x} y="190" textAnchor="middle" className="text-xs fill-on-surface-variant">{g.data.month}</text>
                      </g>
                    );
                  })}
                </svg>
              </div>
            </section>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              <section className="bg-surface-container-lowest rounded-xl border border-surface-container p-5">
                <h3 className="text-lg font-semibold text-primary mb-4">Recent Users</h3>
                <div className="space-y-2">
                  {users.slice(0, 10).map((u) => (
                    <div key={u.id} className="flex items-center justify-between py-2 border-b border-outline-variant last:border-0">
                      <div>
                        <p className="text-sm font-medium text-on-surface">{u.fullName}</p>
                        <p className="text-xs text-on-surface-variant">{u.email}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        {u.role === "admin" && (
                          <span className="text-xs bg-primary-container text-on-primary-container px-2 py-0.5 rounded">Admin</span>
                        )}
                        <span className="text-xs text-on-surface-variant">{new Date(u.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              <section className="bg-surface-container-lowest rounded-xl border border-surface-container p-5">
                <h3 className="text-lg font-semibold text-primary mb-4">Relocation Hotspots</h3>
                {hotspots.length === 0 ? (
                  <p className="text-on-surface-variant text-sm">No profile data yet.</p>
                ) : (
                  <div className="space-y-3">
                    {hotspots.slice(0, 8).map((h) => (
                      <div key={h.country} className="flex items-center gap-3">
                        <span className="text-sm text-on-surface w-32 truncate">{h.country}</span>
                        <div className="flex-1 h-2 bg-surface-container-high rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary rounded-full transition-all"
                            style={{ width: `${(h.count / hotspots[0].count) * 100}%` }}
                          />
                        </div>
                        <span className="text-xs text-on-surface-variant w-8 text-right">{h.count}</span>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            </div>

            <section className="bg-surface-container-lowest rounded-xl border border-surface-container p-5">
              <h3 className="text-lg font-semibold text-primary mb-1">Application Success Rate</h3>
              <p className="text-sm text-on-surface-variant mb-4">Overall completion rate across all applications.</p>
              {successRate && (
                <div className="flex items-center gap-6">
                  <div className="relative w-24 h-24">
                    <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                      <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#e5e7eb" strokeWidth="3" />
                      <path
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        fill="none"
                        stroke="#059669"
                        strokeWidth="3"
                        strokeDasharray={`${successRate.rate} ${100 - successRate.rate}`}
                      />
                    </svg>
                    <span className="absolute inset-0 flex items-center justify-center text-lg font-bold text-emerald-600">{successRate.rate}%</span>
                  </div>
                  <div>
                    <p className="text-sm text-on-surface-variant">Completed: <span className="font-semibold text-on-surface">{successRate.completed}</span></p>
                    <p className="text-sm text-on-surface-variant">Total: <span className="font-semibold text-on-surface">{successRate.total}</span></p>
                  </div>
                </div>
              )}
            </section>
          </>
        )}
      </main>
    </div>
  );
}

import { useState, useEffect } from "react";
import AdminSidebar from "../../components/AdminSidebar";
import { adminApi } from "../../api/admin";

export default function AdminScrapers() {
  const [sources, setSources] = useState([]);
  const [pending, setPending] = useState([]);
  const [stats, setStats] = useState(null);
  const [insights, setInsights] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editSource, setEditSource] = useState(null);
  const [form, setForm] = useState({ name: "", url: "", type: "rss", schedule: "daily" });
  const [tab, setTab] = useState("sources");

  function loadAll() {
    setLoading(true);
    Promise.all([
      adminApi.scrapers.list(),
      adminApi.scrapers.pending(),
      adminApi.scrapers.stats(),
      adminApi.scrapers.insights(),
    ])
      .then(([s, p, st, i]) => {
        setSources(s);
        setPending(p);
        setStats(st);
        setInsights(i);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }

  useEffect(() => { loadAll(); }, []);

  function openCreate() {
    setEditSource(null);
    setForm({ name: "", url: "", type: "rss", schedule: "daily" });
    setShowModal(true);
  }

  function openEdit(source) {
    setEditSource(source);
    setForm({ name: source.name, url: source.url, type: source.type, schedule: source.schedule });
    setShowModal(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      if (editSource) {
        await adminApi.scrapers.update(editSource.id, form);
      } else {
        await adminApi.scrapers.create(form);
      }
      setShowModal(false);
      loadAll();
    } catch (err) {
      alert(err.message);
    }
  }

  async function handleDelete(id) {
    if (!confirm("Delete this source?")) return;
    try {
      await adminApi.scrapers.delete(id);
      loadAll();
    } catch (err) {
      alert(err.message);
    }
  }

  async function handleToggleStatus(source) {
    const newStatus = source.status === "active" ? "inactive" : "active";
    try {
      await adminApi.scrapers.update(source.id, { status: newStatus });
      loadAll();
    } catch (err) {
      alert(err.message);
    }
  }

  async function handleApprove(id) {
    try {
      await adminApi.scrapers.approve(id);
      loadAll();
    } catch (err) {
      alert(err.message);
    }
  }

  async function handleReject(id) {
    try {
      await adminApi.scrapers.reject(id);
      loadAll();
    } catch (err) {
      alert(err.message);
    }
  }

  const tabs = [
    { key: "sources", label: "Sources", icon: "rss_feed" },
    { key: "pending", label: `Pending (${pending.length})`, icon: "pending" },
    { key: "insights", label: "Insights", icon: "insights" },
  ];

  return (
    <div className="bg-surface font-body-md text-body-md text-on-surface min-h-screen flex">
      <AdminSidebar />
      <main className="flex-1 md:ml-64 p-6">
        <header className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-primary mb-1">Scholarship Scraper Manager</h2>
            <p className="text-on-surface-variant">Manage RSS feeds and scraped opportunities.</p>
          </div>
          {stats && (
            <div className="flex gap-4 text-sm">
              <div className="text-center">
                <p className="text-lg font-bold text-primary">{stats.totalSources}</p>
                <p className="text-xs text-on-surface-variant">Sources</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-bold text-emerald-600">{stats.activeSources}</p>
                <p className="text-xs text-on-surface-variant">Active</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-bold text-primary">{stats.totalScraped}</p>
                <p className="text-xs text-on-surface-variant">Scraped</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-bold text-amber-600">{stats.pendingOpportunities}</p>
                <p className="text-xs text-on-surface-variant">Pending</p>
              </div>
            </div>
          )}
        </header>

        {loading ? (
          <p className="text-on-surface-variant">Loading...</p>
        ) : (
          <>
            <div className="flex gap-1 mb-6 bg-surface-container-high rounded-xl p-1 w-fit">
              {tabs.map((t) => (
                <button
                  key={t.key}
                  onClick={() => setTab(t.key)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    tab === t.key
                      ? "bg-surface-container-lowest text-primary shadow-sm"
                      : "text-on-surface-variant hover:text-on-surface"
                  }`}
                >
                  <span className="material-symbols-outlined text-lg">{t.icon}</span>
                  {t.label}
                </button>
              ))}
            </div>

            {tab === "sources" && (
              <section className="bg-surface-container-lowest rounded-xl border border-surface-container p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-primary">Scraper Sources</h3>
                  <button
                    onClick={openCreate}
                    className="bg-primary text-on-primary px-4 py-2 rounded-lg text-sm font-medium hover:opacity-90 transition-opacity flex items-center gap-2"
                  >
                    <span className="material-symbols-outlined text-lg">add</span>
                    Add Source
                  </button>
                </div>
                {sources.length === 0 ? (
                  <p className="text-on-surface-variant text-sm">No sources configured.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-outline-variant text-on-surface-variant">
                          <th className="text-left py-3 px-2 font-medium">Name</th>
                          <th className="text-left py-3 px-2 font-medium">URL</th>
                          <th className="text-left py-3 px-2 font-medium">Type</th>
                          <th className="text-left py-3 px-2 font-medium">Status</th>
                          <th className="text-left py-3 px-2 font-medium">Schedule</th>
                          <th className="text-right py-3 px-2 font-medium">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {sources.map((s) => (
                          <tr key={s.id} className="border-b border-outline-variant/50 hover:bg-surface-container/50">
                            <td className="py-3 px-2 font-medium text-on-surface">{s.name}</td>
                            <td className="py-3 px-2 text-on-surface-variant max-w-[200px] truncate">{s.url}</td>
                            <td className="py-3 px-2">
                              <span className="bg-surface-container-high text-on-surface-variant text-xs px-2 py-0.5 rounded">{s.type}</span>
                            </td>
                            <td className="py-3 px-2">
                              <button
                                onClick={() => handleToggleStatus(s)}
                                className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                                  s.status === "active"
                                    ? "bg-emerald-500/10 text-emerald-600"
                                    : "bg-on-surface/10 text-on-surface-variant"
                                }`}
                              >
                                {s.status}
                              </button>
                            </td>
                            <td className="py-3 px-2 text-on-surface-variant">{s.schedule}</td>
                            <td className="py-3 px-2 text-right">
                              <button onClick={() => openEdit(s)} className="text-primary hover:underline text-xs mr-3">Edit</button>
                              <button onClick={() => handleDelete(s.id)} className="text-error hover:underline text-xs">Delete</button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>
            )}

            {tab === "pending" && (
              <section className="bg-surface-container-lowest rounded-xl border border-surface-container p-5">
                <h3 className="text-lg font-semibold text-primary mb-4">Pending Opportunities</h3>
                {pending.length === 0 ? (
                  <p className="text-on-surface-variant text-sm">No pending opportunities.</p>
                ) : (
                  <div className="space-y-3">
                    {pending.map((opp) => (
                      <div key={opp.id} className="flex items-start justify-between p-4 bg-surface-container rounded-xl border border-surface-container">
                        <div className="flex-1 min-w-0 mr-4">
                          <h4 className="font-medium text-on-surface mb-1">{opp.title}</h4>
                          <p className="text-sm text-on-surface-variant line-clamp-2 mb-2">{opp.description}</p>
                          <div className="flex flex-wrap gap-2 text-xs">
                            {opp.source?.name && (
                              <span className="bg-surface-container-high text-on-surface-variant px-2 py-0.5 rounded">{opp.source.name}</span>
                            )}
                            {opp.funding && <span className="bg-emerald-500/10 text-emerald-600 px-2 py-0.5 rounded">{opp.funding}</span>}
                            {opp.location && <span className="bg-blue-500/10 text-blue-600 px-2 py-0.5 rounded">{opp.location}</span>}
                            {opp.degreeLevel && <span className="bg-amber-500/10 text-amber-600 px-2 py-0.5 rounded">{opp.degreeLevel}</span>}
                          </div>
                        </div>
                        <div className="flex gap-2 shrink-0">
                          <button
                            onClick={() => handleApprove(opp.id)}
                            className="bg-emerald-500/10 text-emerald-600 px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-emerald-500/20 transition-colors"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleReject(opp.id)}
                            className="bg-error/10 text-error px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-error/20 transition-colors"
                          >
                            Reject
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            )}

            {tab === "insights" && insights && (
              <section className="bg-surface-container-lowest rounded-xl border border-surface-container p-5">
                <h3 className="text-lg font-semibold text-primary mb-4">Scraper Insights</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="bg-surface-container rounded-xl p-4 text-center">
                    <p className="text-2xl font-bold text-primary">{insights.totalScraped}</p>
                    <p className="text-sm text-on-surface-variant">Total Opportunities</p>
                  </div>
                  <div className="bg-surface-container rounded-xl p-4 text-center">
                    <p className="text-2xl font-bold text-primary">{insights.totalSources}</p>
                    <p className="text-sm text-on-surface-variant">Total Sources</p>
                  </div>
                  <div className="bg-surface-container rounded-xl p-4 text-center">
                    <p className="text-2xl font-bold text-emerald-600">{insights.activeSources}</p>
                    <p className="text-sm text-on-surface-variant">Active Sources</p>
                  </div>
                </div>
                <h4 className="text-md font-semibold text-primary mb-3">Breakdown by Source</h4>
                <div className="space-y-2">
                  {Object.entries(insights.sourceBreakdown || {}).map(([name, count]) => (
                    <div key={name} className="flex items-center gap-3">
                      <span className="text-sm text-on-surface w-40 truncate">{name}</span>
                      <div className="flex-1 h-2 bg-surface-container-high rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary rounded-full"
                          style={{ width: `${(count / insights.totalScraped) * 100}%` }}
                        />
                      </div>
                      <span className="text-xs text-on-surface-variant w-8 text-right">{count}</span>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </>
        )}

        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setShowModal(false)}>
            <div className="bg-surface rounded-2xl p-6 w-full max-w-md shadow-xl border border-outline-variant" onClick={(e) => e.stopPropagation()}>
              <h3 className="text-lg font-semibold text-primary mb-4">{editSource ? "Edit Source" : "Add New Source"}</h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-on-surface mb-1">Name</label>
                  <input
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full bg-surface-container-high border border-outline-variant rounded-lg px-3 py-2 text-sm text-on-surface focus:outline-none focus:border-primary"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-on-surface mb-1">URL</label>
                  <input
                    value={form.url}
                    onChange={(e) => setForm({ ...form, url: e.target.value })}
                    className="w-full bg-surface-container-high border border-outline-variant rounded-lg px-3 py-2 text-sm text-on-surface focus:outline-none focus:border-primary"
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-on-surface mb-1">Type</label>
                    <select
                      value={form.type}
                      onChange={(e) => setForm({ ...form, type: e.target.value })}
                      className="w-full bg-surface-container-high border border-outline-variant rounded-lg px-3 py-2 text-sm text-on-surface focus:outline-none focus:border-primary"
                    >
                      <option value="rss">RSS</option>
                      <option value="api">API</option>
                      <option value="manual">Manual</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-on-surface mb-1">Schedule</label>
                    <select
                      value={form.schedule}
                      onChange={(e) => setForm({ ...form, schedule: e.target.value })}
                      className="w-full bg-surface-container-high border border-outline-variant rounded-lg px-3 py-2 text-sm text-on-surface focus:outline-none focus:border-primary"
                    >
                      <option value="hourly">Hourly</option>
                      <option value="daily">Daily</option>
                      <option value="weekly">Weekly</option>
                    </select>
                  </div>
                </div>
                <div className="flex gap-3 pt-2">
                  <button type="submit" className="flex-1 bg-primary text-on-primary py-2 rounded-lg text-sm font-medium hover:opacity-90 transition-opacity">
                    {editSource ? "Update" : "Create"}
                  </button>
                  <button type="button" onClick={() => setShowModal(false)} className="flex-1 bg-surface-container-high text-on-surface py-2 rounded-lg text-sm font-medium hover:bg-surface-container transition-colors">
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

import { useState, useEffect } from "react";
import Sidebar from "../components/Sidebar";
import { agentApi } from "../api/agent";
import { applicationApi } from "../api/applications";
import { useAuth } from "../context/AuthContext";

export default function AiAgent() {
  const { user } = useAuth();
  const [status, setStatus] = useState(null);
  const [applications, setApplications] = useState([]);
  const [running, setRunning] = useState(false);
  const [lastResult, setLastResult] = useState(null);

  useEffect(() => {
    if (user) {
      agentApi.status().then(setStatus).catch(() => {});
      applicationApi.list().then((res) => setApplications(Array.isArray(res) ? res : [])).catch(() => {});
    }
  }, [user]);

  async function handleRun() {
    setRunning(true);
    setLastResult(null);
    try {
      const res = await agentApi.run();
      setLastResult(res);
      const apps = await applicationApi.list();
      setApplications(Array.isArray(apps) ? apps : []);
      const newStatus = await agentApi.status();
      setStatus(newStatus);
    } catch (err) {
      setLastResult({ error: err.message });
    } finally {
      setRunning(false);
    }
  }

  return (
    <div className="bg-surface font-body-md text-body-md text-on-surface min-h-screen flex">
      <Sidebar />
      <main className="flex-1 md:ml-64 pt-16 md:pt-0 pb-20 md:pb-0">
        <header className="px-margin-mobile md:px-margin-desktop py-4 border-b border-outline-variant">
          <h2 className="font-display-lg text-display-lg text-primary flex items-center gap-2">
            <span className="material-symbols-outlined text-secondary">smart_toy</span>
            JAPA Auto Agent
          </h2>
          <p className="font-body-md text-body-md text-on-surface-variant">
            Automatically matches scholarships and submits applications on your behalf
          </p>
        </header>

        <div className="px-margin-mobile md:px-margin-desktop py-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-surface-container-lowest rounded-xl p-5 border border-outline-variant">
              <div className="flex items-center gap-3 mb-3">
                <span className="material-symbols-outlined text-primary">person</span>
                <h3 className="font-label-md text-label-md font-semibold">Profile</h3>
              </div>
              <p className="text-sm text-on-surface-variant">
                {status?.hasProfile ? "Profile set — ready for matching" : "No profile yet — set it up below"}
              </p>
            </div>

            <div className="bg-surface-container-lowest rounded-xl p-5 border border-outline-variant">
              <div className="flex items-center gap-3 mb-3">
                <span className="material-symbols-outlined text-secondary">workspace_premium</span>
                <h3 className="font-label-md text-label-md font-semibold">Matches</h3>
              </div>
              <p className="text-3xl font-bold text-primary">{status?.matchedCount || 0}</p>
              <p className="text-sm text-on-surface-variant">scholarships matched</p>
            </div>

            <div className="bg-surface-container-lowest rounded-xl p-5 border border-outline-variant">
              <div className="flex items-center gap-3 mb-3">
                <span className="material-symbols-outlined text-tertiary">assignment_turned_in</span>
                <h3 className="font-label-md text-label-md font-semibold">Applications</h3>
              </div>
              <p className="text-3xl font-bold text-tertiary">{applications.length}</p>
              <p className="text-sm text-on-surface-variant">submitted</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={handleRun}
              disabled={running}
              className="bg-primary text-on-primary px-6 py-3 rounded-xl font-label-md text-label-md hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center gap-2"
            >
              <span className="material-symbols-outlined">{running ? "sync" : "play_arrow"}</span>
              {running ? "Running Agent..." : "Run Agent Now"}
            </button>
            <p className="text-xs text-on-surface-variant">
              {status?.lastRun
                ? `Last run: ${new Date(status.lastRun).toLocaleString()}`
                : "Not run yet — runs automatically on signup and daily at 8 AM"}
            </p>
          </div>

          {lastResult && (
            <div className={`rounded-xl p-5 border ${lastResult.error ? "bg-error-container border-error text-on-error-container" : "bg-surface-container-lowest border-outline-variant"}`}>
              <h4 className="font-label-md text-label-md font-semibold mb-2">
                {lastResult.error ? "Error" : "Last Run Results"}
              </h4>
              {lastResult.error ? (
                <p className="text-sm">{lastResult.error}</p>
              ) : (
                <div className="space-y-3">
                  <p className="text-sm text-on-surface-variant">
                    Found <strong>{lastResult.matches}</strong> matching scholarships, submitted <strong>{lastResult.applications}</strong> applications
                  </p>
                  {lastResult.matchesList?.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant mb-2">Top Matches</p>
                      <div className="space-y-2">
                        {lastResult.matchesList.map((m, i) => (
                          <div key={i} className="flex items-center justify-between bg-surface-container-high rounded-lg px-4 py-2.5">
                            <div>
                              <p className="text-sm font-medium">{m.title}</p>
                              <p className="text-xs text-on-surface-variant">{m.provider} · {m.funding} · {m.location}</p>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs bg-primary-container text-on-primary-container px-2 py-0.5 rounded-full font-semibold">
                                {m.score}%
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          <div>
            <h3 className="font-label-md text-label-md font-semibold mb-3">Application History</h3>
            {applications.length === 0 ? (
              <div className="bg-surface-container-lowest rounded-xl p-8 border border-dashed border-outline-variant text-center">
                <span className="material-symbols-outlined text-4xl text-on-surface-variant mb-2">description</span>
                <p className="text-sm text-on-surface-variant">No applications yet. Run the agent to get started.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {applications.map((app) => (
                  <div key={app.id} className="bg-surface-container-lowest rounded-xl px-5 py-3.5 border border-outline-variant flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">{app.scholarship?.title || "Scholarship"}</p>
                      <p className="text-xs text-on-surface-variant">
                        {app.scholarship?.provider} · Deadline: {app.deadline ? new Date(app.deadline).toLocaleDateString() : "N/A"}
                      </p>
                    </div>
                    <span className={`text-xs px-3 py-1 rounded-full font-semibold ${
                      app.status === "applied" ? "bg-green-100 text-green-800" :
                      app.status === "draft" ? "bg-yellow-100 text-yellow-800" :
                      "bg-gray-100 text-gray-800"
                    }`}>
                      {app.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

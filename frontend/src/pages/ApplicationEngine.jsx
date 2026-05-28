import { useState, useEffect } from 'react'
import Sidebar from '../components/Sidebar'
import { applicationApi } from '../api/applications'
import { scholarshipApi } from '../api/scholarships'

export default function ApplicationEngine() {
  const [applications, setApplications] = useState([])
  const [scholarships, setScholarships] = useState([])
  const [loading, setLoading] = useState(true)
  const [showNew, setShowNew] = useState(false)
  const [selectedScholarship, setSelectedScholarship] = useState('')
  const [appDeadline, setAppDeadline] = useState('')

  useEffect(() => {
    Promise.all([applicationApi.list(), scholarshipApi.list()])
      .then(([apps, schols]) => { setApplications(apps); setScholarships(schols) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const createApp = async () => {
    if (!selectedScholarship) return
    try {
      const app = await applicationApi.create({
        scholarshipId: selectedScholarship,
        deadline: appDeadline || null,
      })
      setApplications(p => [app, ...p])
      setShowNew(false)
      setSelectedScholarship('')
      setAppDeadline('')
    } catch {}
  }

  const updateApp = async (id, data) => {
    try {
      const updated = await applicationApi.update(id, data)
      setApplications(p => p.map(a => a.id === id ? updated : a))
    } catch {}
  }

  const deleteApp = async (id) => {
    try {
      await applicationApi.delete(id)
      setApplications(p => p.filter(a => a.id !== id))
    } catch {}
  }

  return (
    <div className="bg-background text-on-background font-body-md min-h-screen flex">
      <Sidebar/>
      <main className="flex-1 md:ml-64 pt-16 md:pt-0 pb-20 md:pb-0 p-margin-mobile md:p-margin-desktop">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-10 gap-4">
            <div>
              <h2 className="font-headline-lg-mobile md:font-headline-lg text-headline-lg-mobile md:text-headline-lg text-primary mb-2">Auto-Application Engine</h2>
              <p className="font-body-md text-body-md text-on-surface-variant max-w-2xl">Your centralized hub for tracking and submitting university applications.</p>
            </div>
            <button className="bg-primary-container text-on-primary py-3 px-6 rounded-lg font-label-md text-label-md flex items-center gap-2 hover:bg-inverse-surface transition-colors shrink-0" onClick={() => setShowNew(true)}>
              <span className="material-symbols-outlined">add_circle</span>
              New Application
            </button>
          </div>

          {showNew && (
            <div className="bg-surface-container-lowest rounded-xl p-md card-shadow mb-lg border border-secondary">
              <h3 className="font-headline-md text-headline-md text-primary mb-md">Start New Application</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-md mb-md">
                <select className="px-sm py-sm border border-outline-variant rounded-lg bg-surface-container-lowest text-body-md" value={selectedScholarship} onChange={e => setSelectedScholarship(e.target.value)}>
                  <option value="">Select scholarship...</option>
                  {scholarships.map(s => <option key={s.id} value={s.id}>{s.title}</option>)}
                </select>
                <input className="px-sm py-sm border border-outline-variant rounded-lg bg-surface-container-lowest text-body-md" type="date" value={appDeadline} onChange={e => setAppDeadline(e.target.value)} placeholder="Deadline (optional)"/>
              </div>
              <div className="flex gap-sm">
                <button className="bg-primary-container text-on-primary px-4 py-2 rounded-lg font-label-md" onClick={createApp}>Create</button>
                <button className="border border-outline-variant px-4 py-2 rounded-lg font-label-md" onClick={() => setShowNew(false)}>Cancel</button>
              </div>
            </div>
          )}

          {loading ? (
            <p className="text-on-surface-variant">Loading applications...</p>
          ) : applications.length === 0 ? (
            <p className="text-on-surface-variant">No applications yet. Start one above!</p>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter">
              <div className="lg:col-span-8 space-y-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-headline-md text-headline-md text-primary">Active Submissions</h3>
                  <span className="bg-surface-container-high text-on-surface px-3 py-1 rounded-full font-caption text-caption font-semibold">{applications.filter(a=>a.status!=='submitted').length} In Progress</span>
                </div>

                {applications.map(app => (
                  <div key={app.id} className={`bg-surface-container-lowest rounded-xl p-6 card-shadow relative overflow-hidden group ${app.progress >= 90 ? 'border-l-4 border-secondary' : 'border border-outline-variant/30'}`}>
                    <div className="absolute top-0 right-0 w-32 h-32 bg-secondary/5 rounded-bl-full -z-10 group-hover:scale-110 transition-transform"/>
                    <div className="flex justify-between items-start mb-6">
                      <div>
                        <h4 className="font-headline-md text-headline-md text-primary mb-1">{app.scholarship?.title || 'Unknown Scholarship'}</h4>
                        <p className="font-body-md text-body-md text-on-surface-variant flex items-center gap-2">
                          <span className="material-symbols-outlined text-sm">school</span>
                          {app.scholarship?.degreeLevel || 'Program'}
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="font-label-md text-label-md text-error mb-1">{app.deadline ? `Due ${new Date(app.deadline).toLocaleDateString()}` : 'No deadline'}</div>
                      </div>
                    </div>
                    <div className="mb-6">
                      <div className="flex justify-between font-caption text-caption mb-2">
                        <span className={`font-semibold ${app.status === 'submitted' ? 'text-secondary' : 'text-primary'}`}>
                          {app.status === 'draft' ? 'Draft' : app.status === 'submitted' ? 'Submitted' : 'In Progress'}
                        </span>
                        <span className="text-on-surface-variant">{app.progress}% Complete</span>
                      </div>
                      <div className="h-2 w-full bg-surface-container-high rounded-full overflow-hidden">
                        <div className={`h-full rounded-full ${app.progress >= 90 ? 'bg-secondary' : 'bg-primary-container'}`} style={{width:`${app.progress}%`}}/>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button className="border border-primary text-primary px-4 py-2 rounded-lg font-label-md text-label-md hover:bg-surface-container-high transition-colors" onClick={() => updateApp(app.id, { status: 'submitted', progress: 100 })}>Mark Submitted</button>
                      <button className="text-error font-label-md text-label-md px-4 py-2" onClick={() => deleteApp(app.id)}>Delete</button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="lg:col-span-4 space-y-6">
                <div className="bg-gradient-to-br from-surface-container to-surface-container-highest rounded-xl p-6 card-shadow border border-white/50 relative">
                  <div className="absolute top-4 right-4 text-secondary/20">
                    <span className="material-symbols-outlined text-4xl filled">smart_toy</span>
                  </div>
                  <h3 className="font-headline-md text-headline-md text-primary mb-2 relative z-10">Agent Suggestions</h3>
                  <p className="font-body-md text-body-md text-on-surface-variant mb-6 relative z-10">Track your application progress and deadlines.</p>
                  <div className="space-y-4 relative z-10">
                    {applications.filter(a => a.progress < 100).length > 0 ? (
                      applications.filter(a => a.progress < 100).slice(0, 2).map(app => (
                        <div key={app.id} className="bg-surface-container-lowest p-4 rounded-lg card-shadow border border-outline-variant/20 flex gap-3">
                          <span className="material-symbols-outlined text-secondary shrink-0">schedule</span>
                          <div>
                            <p className="font-label-md text-label-md text-on-surface mb-1">{app.scholarship?.title} — {app.progress}% done</p>
                            <p className="font-caption text-caption text-on-surface-variant">Keep going! You're making progress.</p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-on-surface-variant">No pending actions. Great job!</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

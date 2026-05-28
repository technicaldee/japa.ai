import { useState, useEffect } from 'react'
import Sidebar from '../components/Sidebar'
import { Link } from 'react-router-dom'
import { scholarshipApi } from '../api/scholarships'

export default function DiscoveryDashboard() {
  const [scholarships, setScholarships] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    scholarshipApi.list()
      .then(setScholarships)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="bg-surface font-body-md text-body-md text-on-surface min-h-screen flex">
      <Sidebar/>
      <main className="flex-1 md:ml-64 pt-16 md:pt-0 pb-20 md:pb-0 px-margin-mobile md:px-margin-desktop py-lg">
        <header className="mb-lg flex justify-between items-end">
          <div>
            <h2 className="font-display-lg text-display-lg text-primary mb-xs">Opportunity Discovery</h2>
            <p className="font-body-lg text-body-lg text-on-surface-variant max-w-2xl">Based on your academic profile and relocation preferences, we've curated the highest-probability pathways for you.</p>
          </div>
          <div className="hidden md:flex gap-sm">
            <button className="bg-surface-container-lowest border border-outline-variant text-primary font-label-md text-label-md px-4 py-2 rounded-lg hover:bg-surface-container transition-colors flex items-center gap-xs">
              <span className="material-symbols-outlined text-[18px]">filter_list</span>
              Filters
            </button>
          </div>
        </header>

        {loading ? (
          <p className="text-on-surface-variant">Loading opportunities...</p>
        ) : scholarships.length === 0 ? (
          <p className="text-on-surface-variant">No scholarships found yet.</p>
        ) : (
          <>
            {scholarships[0] && (
              <div className="ai-insight-border p-md mb-xl flex items-start gap-md">
                <div className="w-12 h-12 rounded-full bg-surface-container flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-secondary text-[24px]">lightbulb</span>
                </div>
                <div className="flex-1">
                  <h3 className="font-headline-md text-headline-md text-primary mb-xs">AI Insight: High Match Probability</h3>
                  <p className="font-body-md text-body-md text-on-surface-variant mb-4">Your background strongly aligns with this year's priority areas. We recommend prioritizing this application.</p>
                  <div className="flex gap-sm">
                    <Link to={`/scholarship/${scholarships[0].id}`}>
                      <button className="bg-primary-container text-on-primary font-label-md text-label-md px-4 py-2 rounded-lg hover:opacity-90 transition-colors">Start Prep</button>
                    </Link>
                    <button className="bg-transparent border border-outline-variant text-primary font-label-md text-label-md px-4 py-2 rounded-lg hover:bg-surface-container transition-colors">View Criteria</button>
                  </div>
                </div>
              </div>
            )}

            <section className="mb-xl">
              <div className="flex items-center justify-between mb-md">
                <h3 className="font-headline-lg text-headline-lg text-primary flex items-center gap-sm">
                  <span className="material-symbols-outlined text-secondary">workspace_premium</span>
                  Top Tier Scholarships
                </h3>
                <a href="#" className="font-label-md text-label-md text-secondary hover:underline">View all ({scholarships.length})</a>
              </div>

              <div className="grid grid-cols-12 gap-gutter">
                {scholarships[0] && (
                  <Link to={`/scholarship/${scholarships[0].id}`} className="col-span-12 lg:col-span-8 bg-surface-container-lowest rounded-xl card-shadow p-md border border-surface-container flex flex-col justify-between overflow-hidden relative hover:shadow-lg transition-shadow">
                    <div className="absolute -top-24 -right-24 w-64 h-64 bg-surface-container rounded-full opacity-50 blur-3xl pointer-events-none"/>
                    <div className="relative z-10 flex justify-between items-start mb-lg">
                      <div>
                        <div className="flex items-center gap-xs mb-sm">
                          <span className="bg-surface-container-high text-on-surface text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-sm">{scholarships[0].provider}</span>
                          {scholarships[0].matchScore && (
                            <span className="bg-secondary-container text-on-secondary-container text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-sm flex items-center gap-[2px]">
                              <span className="material-symbols-outlined text-[12px]">verified</span> {scholarships[0].matchScore}% Match
                            </span>
                          )}
                        </div>
                        <h4 className="font-display-lg text-display-lg text-primary leading-tight mb-2">{scholarships[0].title}</h4>
                        <p className="font-body-md text-body-md text-on-surface-variant max-w-md">{scholarships[0].description}</p>
                      </div>
                    </div>
                    <div className="relative z-10 grid grid-cols-3 gap-md border-t border-outline-variant pt-md">
                      <div>
                        <p className="font-caption text-caption text-on-surface-variant mb-1">Funding</p>
                        <p className="font-label-md text-label-md text-primary">{scholarships[0].funding}</p>
                      </div>
                      <div>
                        <p className="font-caption text-caption text-on-surface-variant mb-1">Deadline</p>
                        <p className="font-label-md text-label-md text-error flex items-center gap-xs">
                          <span className="material-symbols-outlined text-[16px]">schedule</span> {new Date(scholarships[0].deadline).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex items-end justify-end">
                        <span className="bg-primary-container text-on-primary font-label-md text-label-md px-6 py-2 rounded-lg w-full text-center cursor-pointer">View Details</span>
                      </div>
                    </div>
                  </Link>
                )}

                <div className="col-span-12 lg:col-span-4 flex flex-col gap-gutter">
                  {scholarships.slice(1, 3).map(s => (
                    <Link key={s.id} to={`/scholarship/${s.id}`}>
                      <article className="bg-surface-container-lowest rounded-xl card-shadow p-md border border-surface-container flex-1 flex flex-col justify-between">
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <h4 className="font-headline-md text-headline-md text-primary mb-1">{s.title}</h4>
                            <span className="bg-surface-container-highest text-on-surface-variant text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-sm">{s.degreeLevel}</span>
                          </div>
                          {s.matchScore && (
                            <div className="flex flex-col items-center justify-center w-12 h-12 rounded-full border-2 border-secondary">
                              <span className="font-label-md text-label-md text-secondary">{s.matchScore}%</span>
                            </div>
                          )}
                        </div>
                        <div className="flex justify-between items-end mt-auto pt-4 border-t border-outline-variant">
                          <div>
                            <p className="font-caption text-caption text-on-surface-variant mb-1">Deadline</p>
                            <p className="font-label-md text-label-md text-primary">{new Date(s.deadline).toLocaleDateString()}</p>
                          </div>
                          <span className="text-secondary font-label-md text-label-md">Details →</span>
                        </div>
                      </article>
                    </Link>
                  ))}
                </div>
              </div>
            </section>
          </>
        )}
      </main>
    </div>
  )
}

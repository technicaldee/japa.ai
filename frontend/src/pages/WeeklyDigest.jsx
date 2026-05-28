import { useState, useEffect } from 'react'
import Sidebar from '../components/Sidebar'
import { Link } from 'react-router-dom'
import { digestApi } from '../api/digest'

export default function WeeklyDigest() {
  const [digest, setDigest] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    digestApi.get()
      .then(setDigest)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="bg-surface text-on-surface font-body-md min-h-screen flex">
      <Sidebar/>
      <main className="w-full md:ml-64 pt-20 md:pt-8 px-4 md:px-margin-desktop pb-20 max-w-7xl mx-auto">
        <header className="mb-md">
          <h2 className="font-display-lg text-headline-lg-mobile md:text-display-lg text-on-background mb-2">Your Weekly Digest</h2>
          <p className="font-body-lg text-body-lg text-on-surface-variant">Here is a summary of your relocation journey progress.</p>
        </header>

        {loading ? (
          <p className="text-on-surface-variant">Loading digest...</p>
        ) : !digest ? (
          <p className="text-on-surface-variant">Could not load digest.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-12 gap-gutter">
            <section className="col-span-1 md:col-span-8 bg-surface-container-lowest rounded-xl card-shadow p-md border border-outline-variant/30 flex flex-col gap-sm">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-headline-md text-headline-md text-on-surface flex items-center gap-2">
                  <span className="material-symbols-outlined text-secondary filled">star</span>
                  Top AI Matches
                </h3>
                <Link to="/discovery" className="text-secondary font-label-md text-label-md hover:underline">View All</Link>
              </div>
              <p className="font-body-md text-body-md text-on-surface-variant mb-4">
                {digest.applications?.length > 0
                  ? `You have ${digest.applications.length} active applications.`
                  : 'No active applications yet. Start exploring!'}
              </p>
              <div className="flex flex-col gap-3">
                {digest.applications?.slice(0, 3).map(app => (
                  <div key={app.id} className="p-4 rounded-lg bg-surface flex flex-col sm:flex-row items-start sm:items-center justify-between border border-surface-container hover:card-shadow transition-shadow">
                    <div className="flex-grow">
                      <h4 className="font-label-md text-label-md text-on-surface mb-1">{app.scholarship?.title || 'Scholarship'}</h4>
                      <p className="font-caption text-caption text-on-surface-variant">{app.status} — {app.progress}% complete</p>
                    </div>
                    <div className="mt-3 sm:mt-0 flex items-center gap-4">
                      <Link to="/applications">
                        <button className="w-8 h-8 rounded-full border border-primary text-primary flex items-center justify-center hover:bg-primary hover:text-on-primary transition-colors">
                          <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                        </button>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className="col-span-1 md:col-span-4 bg-primary-container rounded-xl card-shadow-lg p-md flex flex-col gap-sm text-on-primary relative overflow-hidden">
              <div className="absolute -top-12 -right-12 w-32 h-32 bg-secondary opacity-20 rounded-full blur-2xl"/>
              <h3 className="font-headline-md text-headline-md flex items-center gap-2 mb-2 z-10">
                <span className="material-symbols-outlined text-secondary-fixed filled">alarm</span>
                Action Required
              </h3>
              <div className="flex flex-col gap-4 z-10">
                {digest.nextDeadline ? (
                  <div className="border-l-2 border-secondary-fixed pl-3">
                    <p className="font-label-md text-label-md text-secondary-fixed mb-1">
                      Due {new Date(digest.nextDeadline.deadline).toLocaleDateString()}
                    </p>
                    <h4 className="font-body-md text-body-md font-medium text-on-primary">{digest.nextDeadline.scholarship?.title}</h4>
                    <p className="font-caption text-caption text-primary-fixed-dim mt-1">Deadline approaching</p>
                  </div>
                ) : (
                  <p className="text-on-primary">No upcoming deadlines. You're all caught up!</p>
                )}
              </div>
            </section>

            <section className="col-span-1 md:col-span-6 bg-surface-container-lowest rounded-xl card-shadow p-md border border-outline-variant/30 flex flex-col gap-sm">
              <h3 className="font-headline-md text-headline-md text-on-surface flex items-center gap-2 mb-4">
                <span className="material-symbols-outlined text-primary filled">donut_large</span>
                Draft Progress
              </h3>
              <div className="flex flex-col gap-6">
                {digest.applications?.length > 0 ? (
                  digest.applications.slice(0, 3).map(app => (
                    <div key={app.id}>
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-label-md text-label-md text-on-surface">{app.scholarship?.title || 'Application'}</span>
                        <span className="font-label-md text-label-md text-secondary">{app.progress}%</span>
                      </div>
                      <div className="w-full bg-surface-container rounded-full h-2">
                        <div className="bg-secondary h-2 rounded-full" style={{width:`${app.progress}%`}}/>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-on-surface-variant">No drafts in progress.</p>
                )}
              </div>
            </section>

            <section className="col-span-1 md:col-span-6 bg-gradient-to-br from-surface-bright to-surface-container rounded-xl card-shadow p-md border border-secondary/20 flex flex-col gap-sm relative">
              <div className="absolute top-4 right-4 text-secondary opacity-50">
                <span className="material-symbols-outlined text-[48px] filled">lightbulb</span>
              </div>
              <div className="inline-flex items-center gap-2 bg-secondary/10 text-secondary px-3 py-1 rounded-full self-start mb-2">
                <span className="material-symbols-outlined text-[16px] filled">smart_toy</span>
                <span className="font-label-md text-[12px]">AI Tip of the Week</span>
              </div>
              <h3 className="font-headline-md text-headline-md text-on-surface pr-12">{digest.tip?.title || 'AI Tip'}</h3>
              <p className="font-body-md text-body-md text-on-surface-variant mt-2">
                {digest.tip?.body || 'Keep working on your applications consistently.'}
              </p>
              <button className="mt-4 self-start border border-primary text-primary px-4 py-2 rounded-lg font-label-md text-label-md hover:bg-surface-container-high transition-colors">
                Start Practice Session
              </button>
            </section>
          </div>
        )}
      </main>
    </div>
  )
}

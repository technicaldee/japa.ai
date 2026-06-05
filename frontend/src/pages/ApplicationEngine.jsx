import { useState, useEffect } from 'react'
import Sidebar from '../components/Sidebar'
import { applicationApi } from '../api/applications'

const docIcons = {
  transcript: 'school',
  essay: 'edit_note',
  reference_letter: 'contact_mail',
  passport: 'badge',
  ielts: 'language',
  cv: 'description',
  statement_of_purpose: 'edit_note',
  recommendation: 'contact_mail',
  financial_statement: 'account_balance',
}

const docLabels = {
  transcript: 'Academic Transcripts',
  essay: 'Personal Statement / Essay',
  reference_letter: 'Reference Letters',
  passport: 'Passport Copy',
  ielts: 'English Proficiency (IELTS/TOEFL)',
  cv: 'Curriculum Vitae',
  statement_of_purpose: 'Statement of Purpose',
  recommendation: 'Recommendation Letter',
  financial_statement: 'Financial Statement',
}

const docCategories = {
  ai_generated: { label: 'AI-Generated', icon: 'magic', color: 'text-purple-600 bg-purple-50' },
  user_upload: { label: 'You Upload', icon: 'upload_file', color: 'text-amber-600 bg-amber-50' },
  template: { label: 'Template Ready', icon: 'description', color: 'text-blue-600 bg-blue-50' },
}

function getDocCategory(type) {
  const aiTypes = ['essay', 'statement_of_purpose']
  const templateTypes = ['recommendation', 'reference_letter']
  if (aiTypes.includes(type)) return 'ai_generated'
  if (templateTypes.includes(type)) return 'template'
  return 'user_upload'
}

export default function ApplicationEngine() {
  const [applications, setApplications] = useState([])
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(null)
  const [expandedEssay, setExpandedEssay] = useState(null)

  useEffect(() => {
    applicationApi.list()
      .then(setApplications)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const updateApp = async (id, data) => {
    try {
      const updated = await applicationApi.update(id, data)
      setApplications(p => p.map(a => a.id === id ? updated : a))
    } catch {}
  }

  const handleGenerateEssay = async (appId) => {
    setGenerating(appId)
    try {
      const res = await applicationApi.generateEssay(appId)
      setApplications(p => p.map(a =>
        a.id === appId ? { ...a, essayContent: res.essay } : a
      ))
    } catch {}
    setGenerating(null)
  }

  const parsedDocs = (app) => {
    try {
      const docs = typeof app.requiredDocs === 'string' ? JSON.parse(app.requiredDocs) : (app.requiredDocs || [])
      return Array.isArray(docs) ? docs : []
    } catch {
      return []
    }
  }

  return (
    <div className="bg-background text-on-background font-body-md min-h-screen flex">
      <Sidebar/>
      <main className="flex-1 md:ml-64 pt-16 md:pt-0 pb-20 md:pb-0 px-margin-mobile md:px-margin-desktop py-lg">
        <div className="max-w-7xl mx-auto">
          <div className="mb-10">
            <h2 className="font-headline-lg text-headline-lg text-primary mb-2">Auto-Application Engine</h2>
            <p className="font-body-md text-body-md text-on-surface-variant max-w-2xl">
              The agent discovers requirements, drafts your essay, and tracks what's left for you to submit.
            </p>
          </div>

          {loading ? (
            <p className="text-on-surface-variant">Loading applications...</p>
          ) : applications.length === 0 ? (
            <div className="bg-surface-container-lowest rounded-xl p-8 border border-dashed border-outline-variant text-center">
              <span className="material-symbols-outlined text-4xl text-on-surface-variant mb-2">description</span>
              <p className="text-on-surface-variant">No applications yet. Run the agent from the Auto Agent page to start.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {applications.map(app => {
                const docs = parsedDocs(app)
                const hasEssay = app.essayContent && app.essayContent.length > 0
                const allGenerated = docs.filter(d => getDocCategory(d) === 'ai_generated').every(d =>
                  d === 'essay' ? hasEssay : false
                )
                const docsComplete = docs.length === 0 || allGenerated || app.status === 'submitted'
                const currentProgress = app.status === 'submitted' ? 100 : docsComplete ? 80 : app.progress

                return (
                  <div key={app.id} className={`bg-surface-container-lowest rounded-xl card-shadow overflow-hidden ${
                    app.status === 'submitted' ? 'border-l-4 border-secondary' : 'border border-outline-variant/30'
                  }`}>
                    {/* Header */}
                    <div className="p-6 pb-4 flex flex-col md:flex-row justify-between items-start gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-headline-md text-headline-md text-primary">
                            {app.scholarship?.title || 'Scholarship'}
                          </h3>
                          {app.status === 'submitted' && (
                            <span className="bg-green-100 text-green-700 text-xs px-3 py-1 rounded-full font-semibold flex items-center gap-1">
                              <span className="material-symbols-outlined text-[14px]">check_circle</span>
                              Submitted
                            </span>
                          )}
                        </div>
                        <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-on-surface-variant">
                          <span className="flex items-center gap-1">
                            <span className="material-symbols-outlined text-[14px]">school</span>
                            {app.scholarship?.provider || 'N/A'}
                          </span>
                          <span className="flex items-center gap-1">
                            <span className="material-symbols-outlined text-[14px]">payments</span>
                            {app.scholarship?.funding || 'N/A'}
                          </span>
                          {app.deadline && (
                            <span className="flex items-center gap-1">
                              <span className="material-symbols-outlined text-[14px]">calendar_today</span>
                              Due {new Date(app.deadline).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="text-right shrink-0 w-full md:w-32">
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-xs text-on-surface-variant">Progress</span>
                          <span className="text-xs font-semibold text-primary">{currentProgress}%</span>
                        </div>
                        <div className="h-2 w-full bg-surface-container-high rounded-full overflow-hidden">
                          <div className={`h-full rounded-full transition-all ${
                            currentProgress >= 100 ? 'bg-secondary' : 'bg-primary-container'
                          }`} style={{ width: `${currentProgress}%` }} />
                        </div>
                      </div>
                    </div>

                    {/* Required Documents Section */}
                    <div className="px-6 pb-4">
                      <h4 className="font-label-md text-label-md text-on-surface mb-3 flex items-center gap-2">
                        <span className="material-symbols-outlined text-[18px]">checklist</span>
                        Required Documents
                      </h4>
                      {docs.length === 0 ? (
                        <p className="text-sm text-on-surface-variant italic">
                          No requirements extracted yet. Run the agent to analyze this scholarship.
                        </p>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                          {docs.map((doc, i) => {
                            const category = getDocCategory(doc)
                            const cfg = docCategories[category]
                            const isEssay = doc === 'essay'
                            const isDone = isEssay ? hasEssay : false

                            return (
                              <div key={i} className={`flex items-center gap-3 px-4 py-3 rounded-lg border ${
                                isDone ? 'bg-green-50 border-green-200' : 'bg-surface-container border-outline-variant/50'
                              }`}>
                                <span className={`material-symbols-outlined text-[20px] ${
                                  isDone ? 'text-green-600' : 'text-on-surface-variant'
                                }`}>
                                  {isDone ? 'check_circle' : (docIcons[doc] || 'description')}
                                </span>
                                <div className="flex-1 min-w-0">
                                  <p className={`text-sm font-medium truncate ${isDone ? 'text-green-700' : 'text-on-surface'}`}>
                                    {docLabels[doc] || doc}
                                  </p>
                                  <span className={`text-xs px-2 py-0.5 rounded-full inline-block mt-0.5 ${cfg.color}`}>
                                    {cfg.label}
                                  </span>
                                  {isEssay && !isDone && (
                                    <button
                                      onClick={() => handleGenerateEssay(app.id)}
                                      disabled={generating === app.id}
                                      className="text-xs text-secondary font-semibold hover:underline ml-2"
                                    >
                                      {generating === app.id ? 'Generating...' : 'Generate'}
                                    </button>
                                  )}
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      )}
                    </div>

                    {/* Generated Essay */}
                    {hasEssay && (
                      <div className="px-6 pb-4">
                        <button
                          onClick={() => setExpandedEssay(expandedEssay === app.id ? null : app.id)}
                          className="flex items-center gap-2 text-sm font-semibold text-secondary hover:underline"
                        >
                          <span className="material-symbols-outlined text-[18px]">
                            {expandedEssay === app.id ? 'expand_less' : 'expand_more'}
                          </span>
                          Personal Statement ({app.essayContent.length} chars)
                        </button>
                        {expandedEssay === app.id && (
                          <div className="mt-3 p-4 bg-surface rounded-lg border border-outline-variant/30 text-sm text-on-surface whitespace-pre-wrap leading-relaxed max-h-96 overflow-y-auto">
                            {app.essayContent}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Actions */}
                    <div className="px-6 py-4 bg-surface-container/50 border-t border-outline-variant/20 flex flex-wrap gap-3 items-center">
                      {app.status !== 'submitted' && (
                        <button
                          onClick={() => updateApp(app.id, { status: 'submitted', progress: 100 })}
                          className="bg-secondary text-on-secondary px-5 py-2 rounded-lg font-label-md text-label-md hover:opacity-90 transition-opacity flex items-center gap-2"
                        >
                          <span className="material-symbols-outlined text-[18px]">check</span>
                          Mark Submitted
                        </button>
                      )}
                      {!hasEssay && docs.some(d => d === 'essay' || d === 'statement_of_purpose') && (
                        <button
                          onClick={() => handleGenerateEssay(app.id)}
                          disabled={generating === app.id}
                          className="border border-secondary text-secondary px-5 py-2 rounded-lg font-label-md text-label-md hover:bg-surface-container-high transition-colors flex items-center gap-2"
                        >
                          <span className="material-symbols-outlined text-[18px]">
                            {generating === app.id ? 'sync' : 'auto_awesome'}
                          </span>
                          {generating === app.id ? 'Generating...' : 'Generate Essay'}
                        </button>
                      )}
                      <button
                        onClick={() => updateApp(app.id, app.status === 'submitted'
                          ? { status: 'draft', progress: 50 }
                          : { status: 'submitted', progress: 100 }
                        )}
                        className="text-on-surface-variant text-sm px-4 py-2 hover:text-primary transition-colors"
                      >
                        {app.status === 'submitted' ? 'Undo Submission' : 'Skip'}
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

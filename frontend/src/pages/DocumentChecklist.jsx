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
  essay: 'Personal Statement',
  reference_letter: 'Reference Letters',
  passport: 'Passport Copy',
  ielts: 'English Proficiency',
  cv: 'Curriculum Vitae',
  statement_of_purpose: 'Statement of Purpose',
  recommendation: 'Recommendation Letter',
  financial_statement: 'Financial Statement',
}

const docCategories = {
  ai_generated: { label: 'AI-Generated', class: 'bg-purple-100 text-purple-700' },
  user_upload: { label: 'You Upload', class: 'bg-amber-100 text-amber-700' },
  template: { label: 'Template Ready', class: 'bg-blue-100 text-blue-700' },
}

function getDocCategory(type) {
  if (['essay', 'statement_of_purpose'].includes(type)) return 'ai_generated'
  if (['recommendation', 'reference_letter'].includes(type)) return 'template'
  return 'user_upload'
}

function parseDocs(app) {
  try {
    const docs = typeof app.requiredDocs === 'string' ? JSON.parse(app.requiredDocs) : (app.requiredDocs || [])
    return Array.isArray(docs) ? docs : []
  } catch { return [] }
}

export default function DocumentChecklist() {
  const [applications, setApplications] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    applicationApi.list()
      .then(setApplications)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const allDocTypes = new Map()
  applications.forEach(app => {
    parseDocs(app).forEach(doc => {
      if (!allDocTypes.has(doc)) {
        allDocTypes.set(doc, { type: doc, label: docLabels[doc] || doc, category: getDocCategory(doc), scholarships: [] })
      }
      allDocTypes.get(doc).scholarships.push(app.scholarship?.title || 'Unknown')
    })
  })
  const docsList = [...allDocTypes.values()]

  return (
    <div className="bg-background text-on-background font-body-md min-h-screen flex">
      <Sidebar/>
      <main className="flex-1 md:ml-64 pt-16 md:pt-0 pb-20 md:pb-0 px-margin-mobile md:px-margin-desktop py-lg">
        <div className="max-w-7xl mx-auto">
          <div className="mb-10">
            <h2 className="font-headline-lg text-headline-lg text-primary mb-2">Document Center</h2>
            <p className="font-body-md text-body-md text-on-surface-variant max-w-2xl">
              Requirements extracted from scholarship pages by the agent. AI can draft essays and statement of purpose for you.
            </p>
          </div>

          {loading ? (
            <p className="text-on-surface-variant">Loading...</p>
          ) : docsList.length === 0 ? (
            <div className="bg-surface-container-lowest rounded-xl p-8 border border-dashed border-outline-variant text-center">
              <span className="material-symbols-outlined text-4xl text-on-surface-variant mb-2">checklist</span>
              <p className="text-on-surface-variant">No document requirements found yet. Run the agent to analyze scholarships.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {docsList.map(({ type, label, category, scholarships }) => {
                const cfg = docCategories[category]
                return (
                  <div key={type} className="bg-surface-container-lowest rounded-xl p-5 border border-outline-variant/30 card-shadow">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 rounded-xl bg-surface-container flex items-center justify-center text-primary">
                        <span className="material-symbols-outlined">{docIcons[type] || 'description'}</span>
                      </div>
                      <div>
                        <h3 className="font-label-md text-label-md text-on-surface">{label || type}</h3>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${cfg.class}`}>{cfg.label}</span>
                      </div>
                    </div>
                    <div className="mb-4">
                      <p className="text-xs text-on-surface-variant uppercase tracking-wider font-semibold mb-2">
                        Needed for ({scholarships.length})
                      </p>
                      <div className="space-y-1">
                        {scholarships.slice(0, 3).map((s, i) => (
                          <p key={i} className="text-sm text-on-surface truncate">{s}</p>
                        ))}
                        {scholarships.length > 3 && (
                          <p className="text-xs text-on-surface-variant">+{scholarships.length - 3} more</p>
                        )}
                      </div>
                    </div>
                    <div className={`text-xs px-3 py-2 rounded-lg ${
                      category === 'ai_generated' ? 'bg-purple-50 text-purple-700' :
                      category === 'template' ? 'bg-blue-50 text-blue-700' :
                      'bg-amber-50 text-amber-700'
                    }`}>
                      {category === 'ai_generated' && 'AI can draft this from your profile'}
                      {category === 'template' && 'Agent can prepare a template for you'}
                      {category === 'user_upload' && 'You need to upload this document'}
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

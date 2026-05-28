import { useState, useEffect } from 'react'
import Sidebar from '../components/Sidebar'
import { documentApi } from '../api/documents'

const docTypes = [
  { id: 'IELTS', icon: 'language', label: 'IELTS Academic Scores' },
  { id: 'police_clearance', icon: 'policy', label: 'Police Clearance' },
  { id: 'transcript', icon: 'school', label: 'Academic Transcripts' },
  { id: 'passport', icon: 'badge', label: 'Passport Copy' },
  { id: 'reference_letter', icon: 'contact_mail', label: 'Reference Letters (x2)' },
]

export default function DocumentChecklist() {
  const [documents, setDocuments] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchDocs = () => {
    documentApi.list()
      .then(setDocuments)
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchDocs() }, [])

  const getStatus = (type) => {
    const doc = documents.find(d => d.type === type)
    return doc ? doc.status : 'pending'
  }

  const createDoc = async (type) => {
    try {
      await documentApi.create({ type })
      fetchDocs()
    } catch {}
  }

  const statusConfig = {
    pending: { class: 'bg-tertiary-fixed text-on-tertiary-fixed-variant', icon: 'pending', label: 'Pending Upload' },
    in_review: { class: 'bg-primary-fixed text-on-primary-fixed', icon: 'hourglass_empty', label: 'In Review' },
    verified: { class: 'bg-[#E8F5E9] text-[#2E7D32]', icon: 'verified', label: 'Verified' },
  }

  const verifiedCount = documents.filter(d => d.status === 'verified').length
  const progress = documents.length > 0 ? Math.round((verifiedCount / documents.length) * 100) : 0

  return (
    <div className="bg-background min-h-screen text-on-background font-body-md flex bg-grid-pattern">
      <Sidebar/>
      <main className="flex-1 md:ml-64 pt-16 md:pt-0 pb-20 md:pb-0">
        <div className="flex-1 px-margin-mobile md:px-margin-desktop py-lg md:py-margin-desktop max-w-[1280px] mx-auto w-full">
          <div className="mb-lg flex flex-col md:flex-row md:items-end justify-between gap-md">
            <div>
              <h2 className="font-display-lg text-display-lg text-primary tracking-tight mb-xs">Document Center</h2>
              <p className="font-body-lg text-body-lg text-on-surface-variant max-w-2xl">Manage and upload required documentation for your targeted relocation pathways.</p>
            </div>
          </div>

          {loading ? (
            <p className="text-on-surface-variant">Loading documents...</p>
          ) : (
            <>
              <div className="mb-lg">
                <div className="flex justify-between items-end mb-sm">
                  <div>
                    <span className="font-label-md text-label-md text-on-surface uppercase tracking-wider text-xs">Overall Progress</span>
                    <h4 className="font-headline-md text-headline-md text-primary">{progress}% Complete</h4>
                  </div>
                  <span className="font-body-md text-body-md text-on-surface-variant">{verifiedCount} of {documents.length} Verified</span>
                </div>
                <div className="w-full h-3 bg-surface-container-high rounded-full overflow-hidden border border-outline-variant/20">
                  <div className="h-full bg-secondary rounded-full transition-all duration-1000 ease-out" style={{width:`${progress}%`}}/>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-md lg:gap-lg">
                {docTypes.map(({ id, icon, label }) => {
                  const status = getStatus(id)
                  const cfg = statusConfig[status]
                  return (
                    <div key={id} className="bg-surface-container-lowest rounded-xl p-md flex flex-col border border-outline-variant/30 card-shadow hover:shadow-lg transition-all">
                      <div className="flex justify-between items-start mb-md">
                        <div className="w-12 h-12 rounded-xl bg-surface-container flex items-center justify-center text-primary">
                          <span className="material-symbols-outlined">{icon}</span>
                        </div>
                        <div className={`px-sm py-1 rounded-full ${cfg.class} font-label-md text-label-md text-xs flex items-center gap-xs`}>
                          <span className="material-symbols-outlined text-[14px]">{cfg.icon}</span>
                          {cfg.label}
                        </div>
                      </div>
                      <div className="mb-lg flex-1">
                        <h3 className="font-label-md text-label-md text-on-surface text-lg mb-xs">{label}</h3>
                      </div>
                      {status === 'pending' && (
                        <button className="w-full bg-transparent text-primary-container font-label-md text-label-md py-sm px-md rounded-lg border border-primary-container hover:bg-surface-container transition-colors flex justify-center items-center gap-xs" onClick={() => createDoc(id)}>
                          <span className="material-symbols-outlined text-[18px]">upload</span>
                          Upload
                        </button>
                      )}
                      {status === 'verified' && (
                        <div className="w-full py-sm px-md rounded-lg bg-surface-container text-primary font-label-md text-label-md text-center flex justify-center items-center gap-xs opacity-70">
                          <span className="material-symbols-outlined text-[18px]">check_circle</span>
                          Requirement Met
                        </div>
                      )}
                      {status === 'in_review' && (
                        <div className="w-full py-sm px-md rounded-lg bg-surface-container text-primary font-label-md text-label-md text-center flex justify-center items-center gap-xs">
                          <span className="material-symbols-outlined text-[18px]">hourglass_empty</span>
                          In Review
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  )
}

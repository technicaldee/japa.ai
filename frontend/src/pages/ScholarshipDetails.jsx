import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import Sidebar from '../components/Sidebar'
import { scholarshipApi } from '../api/scholarships'
import { applicationApi } from '../api/applications'

export default function ScholarshipDetails() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [scholarship, setScholarship] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id) { setLoading(false); return }
    scholarshipApi.get(id)
      .then(setScholarship)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [id])

  const startApplication = async () => {
    if (!scholarship) return
    try {
      await applicationApi.create({ scholarshipId: scholarship.id })
      navigate('/applications')
    } catch {}
  }

  if (loading) return (
    <div className="bg-background text-on-background font-body-md min-h-screen flex flex-col md:flex-row">
      <Sidebar/>
      <main className="flex-1 md:ml-64 pt-16 md:pt-0 pb-32 p-margin-mobile md:p-margin-desktop max-w-[1280px] mx-auto w-full">
        <p>Loading...</p>
      </main>
    </div>
  )

  if (!scholarship) return (
    <div className="bg-background text-on-background font-body-md min-h-screen flex flex-col md:flex-row">
      <Sidebar/>
      <main className="flex-1 md:ml-64 pt-16 md:pt-0 pb-32 p-margin-mobile md:p-margin-desktop max-w-[1280px] mx-auto w-full">
        <button onClick={()=>navigate(-1)} className="flex items-center gap-xs text-on-surface-variant hover:text-primary transition-colors font-label-md text-label-md mb-md">
          <span className="material-symbols-outlined text-[18px]">arrow_back</span>
          Back
        </button>
        <p>Scholarship not found.</p>
      </main>
    </div>
  )

  return (
    <div className="bg-background text-on-background font-body-md min-h-screen flex flex-col md:flex-row">
      <Sidebar/>
      <main className="flex-1 md:ml-64 pt-16 md:pt-0 pb-32 p-margin-mobile md:p-margin-desktop max-w-[1280px] mx-auto w-full">
        <button onClick={()=>navigate(-1)} className="flex items-center gap-xs text-on-surface-variant hover:text-primary transition-colors font-label-md text-label-md mb-md">
          <span className="material-symbols-outlined text-[18px]">arrow_back</span>
          Back to Discovery
        </button>

        <header className="bg-surface-container-lowest rounded-xl p-md md:p-lg card-shadow mb-gutter border border-outline-variant/20 relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-md">
          <div className="absolute top-0 right-0 w-64 h-64 bg-secondary-container/20 rounded-full blur-3xl -z-10 translate-x-1/2 -translate-y-1/2"/>
          <div className="flex items-center gap-md z-10 w-full md:w-auto">
            <div className="w-16 h-16 md:w-20 md:h-20 bg-surface-container flex items-center justify-center rounded-lg border border-outline-variant/30 flex-shrink-0">
              <span className="material-symbols-outlined text-primary text-headline-lg">school</span>
            </div>
            <div className="flex-1">
              <h1 className="font-headline-lg-mobile md:font-headline-lg text-headline-lg-mobile md:text-headline-lg text-primary mb-xs">{scholarship.title}</h1>
              <p className="font-body-md text-body-md text-on-surface-variant flex items-center gap-xs">
                <span className="material-symbols-outlined text-[16px]">public</span>
                {scholarship.provider}
              </p>
            </div>
          </div>
          {scholarship.matchScore && (
            <div className="flex items-center gap-sm bg-surface-container-lowest border border-secondary-container rounded-lg p-sm card-shadow z-10 w-full md:w-auto justify-between md:justify-start">
              <div className="flex flex-col">
                <span className="font-caption text-caption text-on-surface-variant uppercase tracking-wider">AI Match Score</span>
                <span className="font-headline-md text-headline-md text-secondary font-bold">{scholarship.matchScore}%</span>
              </div>
              <div className="w-12 h-12 rounded-full border-4 border-surface-container flex items-center justify-center relative">
                <svg className="w-full h-full transform -rotate-90 absolute" viewBox="0 0 36 36">
                  <path className="text-surface-variant" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="4"/>
                  <path className="text-secondary" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeDasharray={`${scholarship.matchScore}, 100`} strokeWidth="4"/>
                </svg>
                <span className="material-symbols-outlined text-secondary text-[20px] absolute filled">star</span>
              </div>
            </div>
          )}
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-gutter mb-gutter">
          <div className="col-span-1 flex flex-col gap-gutter">
            <div className="bg-surface-container-lowest rounded-xl p-md card-shadow border border-outline-variant/20">
              <h2 className="font-label-md text-label-md text-on-background mb-md pb-xs border-b border-outline-variant/30 flex items-center gap-xs">
                <span className="material-symbols-outlined text-[18px] text-on-surface-variant">info</span>
                Overview
              </h2>
              <ul className="flex flex-col gap-sm">
                {[
                  {icon:'payments',label:'Funding',value:scholarship.funding},
                  {icon:'event',label:'Deadline',value:new Date(scholarship.deadline).toLocaleDateString()},
                  {icon:'location_on',label:'Location',value:scholarship.location},
                  {icon:'school',label:'Degree Level',value:scholarship.degreeLevel},
                ].map(({icon,label,value}) => (
                  <li key={label} className="flex items-start gap-sm">
                    <div className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center flex-shrink-0 mt-1">
                      <span className="material-symbols-outlined text-[16px] text-primary">{icon}</span>
                    </div>
                    <div>
                      <p className="font-caption text-caption text-on-surface-variant">{label}</p>
                      <p className="font-body-md text-body-md text-on-background font-medium">{value}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="col-span-1 md:col-span-2">
            <div className="bg-surface-container-lowest rounded-xl card-shadow border border-secondary-container/50 overflow-hidden h-full flex flex-col relative">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-secondary via-secondary-container to-secondary"/>
              <div className="p-md border-b border-outline-variant/20">
                <h2 className="font-headline-md text-headline-md text-primary mb-2">About this Scholarship</h2>
                <p className="font-body-md text-body-md text-on-surface-variant">{scholarship.description}</p>
              </div>
              {scholarship.eligibility?.length > 0 && (
                <div className="p-md">
                  <h3 className="font-label-md text-label-md text-primary mb-3">Eligibility Requirements</h3>
                  <ul className="flex flex-col gap-sm">
                    {scholarship.eligibility.map((req, i) => (
                      <li key={i} className="flex items-center gap-sm">
                        <span className="material-symbols-outlined text-secondary filled text-sm">check_circle</span>
                        <span className="font-body-md text-body-md text-on-background">{req}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="fixed bottom-0 left-0 md:left-64 right-0 p-margin-mobile md:p-md bg-surface-container-lowest/90 backdrop-blur-md border-t border-outline-variant/20 flex flex-col md:flex-row justify-between items-center gap-sm z-30">
          <p className="font-caption text-caption text-on-surface-variant hidden md:block">Application takes approximately 15 minutes to auto-fill.</p>
          <div className="flex w-full md:w-auto gap-sm">
            <button className="flex-1 md:flex-none px-md py-sm rounded-lg border border-primary text-primary font-label-md text-label-md hover:bg-surface-container transition-colors flex items-center justify-center gap-xs">
              <span className="material-symbols-outlined text-[18px]">bookmark_border</span>
              Save for Later
            </button>
            <button className="flex-1 md:flex-none px-md py-sm rounded-lg bg-primary-container text-on-primary font-label-md text-label-md hover:bg-primary transition-colors flex items-center justify-center gap-xs card-shadow" onClick={startApplication}>
              <span className="material-symbols-outlined text-[18px]">send</span>
              Start Auto-Fill
            </button>
          </div>
        </div>
      </main>
    </div>
  )
}

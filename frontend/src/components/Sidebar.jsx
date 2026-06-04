import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Logo from './Logo'

const baseNavItems = [
  { path: '/profile', icon: 'person', label: 'Profile' },
  { path: '/discovery', icon: 'explore', label: 'Discovery' },
  { path: '/agent', icon: 'smart_toy', label: 'Auto Agent' },
  { path: '/applications', icon: 'assignment', label: 'Applications' },
  { path: '/documents', icon: 'description', label: 'Documents' },
  { path: '/digest', icon: 'auto_stories', label: 'Weekly Digest' },
]

export default function Sidebar() {
  const { pathname } = useLocation()
  const { user, logout, isAdmin } = useAuth()
  const navItems = isAdmin
    ? [...baseNavItems, { path: '/admin', icon: 'shield', label: 'Admin' }]
    : baseNavItems
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  return (
    <>
      <aside className="hidden md:flex flex-col h-screen w-64 fixed left-0 top-0 bg-surface-container py-8 px-4 z-50">
        <div className="flex items-center gap-3 px-4 mb-10">
          <Logo className="h-16 w-auto" />
        </div>

        <nav className="flex-1 space-y-2">
          {navItems.map(({ path, icon, label }) => {
            const active = pathname === path || (path !== '/' && pathname.startsWith(path))
            return (
              <Link key={path} to={path}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg font-label-md text-label-md transition-all duration-200 ${
                  active
                    ? 'text-secondary font-bold border-r-4 border-secondary bg-surface-container-highest'
                    : 'text-on-surface-variant font-medium hover:bg-surface-container-high hover:text-primary'
                }`}>
                <span className={`material-symbols-outlined ${active ? 'filled' : ''}`}>{icon}</span>
                <span>{label}</span>
              </Link>
            )
          })}
        </nav>

        <div className="mt-auto pt-6 border-t border-outline-variant/30 space-y-4">
          {user && (
            <div className="px-4 py-2 text-on-surface-variant font-body-md text-sm">
              Signed in as <span className="text-primary font-medium">{user.fullName}</span>
            </div>
          )}
          <div className="space-y-1">
            <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-2 rounded-lg text-on-surface-variant font-medium hover:bg-surface-container-high hover:text-primary transition-all font-label-md text-label-md">
              <span className="material-symbols-outlined">logout</span><span>Sign Out</span>
            </button>
          </div>
        </div>
      </aside>

      <header className="md:hidden flex justify-between items-center px-4 w-full h-16 bg-surface shadow-sm fixed top-0 z-50">
        <div className="flex items-center gap-2">
          <Logo className="h-7 w-auto" />
        </div>
        <div className="flex items-center gap-4">
          <span className="material-symbols-outlined cursor-pointer text-on-surface-variant">notifications</span>
          <div className="w-8 h-8 rounded-full bg-primary-container border border-outline-variant" />
        </div>
      </header>

      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-surface-container-lowest border-t border-outline-variant/30 z-50 flex justify-around py-2">
        {navItems.map(({ path, icon, label }) => {
          const active = pathname === path || (path !== '/' && pathname.startsWith(path))
          return (
            <Link key={path} to={path} className={`flex flex-col items-center gap-1 px-3 py-1 ${active ? 'text-secondary' : 'text-on-surface-variant'}`}>
              <span className={`material-symbols-outlined text-[22px] ${active ? 'filled' : ''}`}>{icon}</span>
              <span className="font-caption text-caption">{label}</span>
            </Link>
          )
        })}
      </nav>
    </>
  )
}

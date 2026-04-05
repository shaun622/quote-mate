import { Outlet } from 'react-router-dom'
import BottomNav from './BottomNav.jsx'
import OfflineBanner from './OfflineBanner.jsx'

export default function AppShell() {
  return (
    <div className="min-h-full flex flex-col">
      <OfflineBanner />
      <main className="flex-1 pb-20 safe-top">
        <Outlet />
      </main>
      <BottomNav />
    </div>
  )
}

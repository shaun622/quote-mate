import { Routes, Route, Navigate } from 'react-router-dom'
import AppShell from './components/layout/AppShell.jsx'
import Dashboard from './components/dashboard/Dashboard.jsx'
import QuoteList from './components/quotes/QuoteList.jsx'
import QuoteCreate from './components/quotes/QuoteCreate.jsx'
import JobList from './components/jobs/JobList.jsx'
import ScheduleCalendar from './components/calendar/ScheduleCalendar.jsx'
import SettingsIndex from './components/settings/SettingsIndex.jsx'
import BusinessProfile from './components/settings/BusinessProfile.jsx'
import PricingList from './components/pricing/PricingList.jsx'
import Subscription from './components/settings/Subscription.jsx'
import CustomerQuoteView from './components/public/CustomerQuoteView.jsx'

export default function App() {
  return (
    <Routes>
      {/* Public customer-facing quote page (no auth, no app shell) */}
      <Route path="/quote/:token" element={<CustomerQuoteView />} />

      {/* Authenticated app */}
      <Route element={<AppShell />}>
        <Route index element={<Dashboard />} />
        <Route path="quotes" element={<QuoteList />} />
        <Route path="quotes/new" element={<QuoteCreate />} />
        <Route path="jobs" element={<JobList />} />
        <Route path="calendar" element={<ScheduleCalendar />} />
        <Route path="settings" element={<SettingsIndex />} />
        <Route path="settings/business" element={<BusinessProfile />} />
        <Route path="settings/pricing" element={<PricingList />} />
        <Route path="settings/subscription" element={<Subscription />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

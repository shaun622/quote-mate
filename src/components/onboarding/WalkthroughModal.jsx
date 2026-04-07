import { useState } from 'react'
import {
  FileText,
  Send,
  CheckCircle2,
  Briefcase,
  Camera,
  Calendar,
  ChevronRight,
  ChevronLeft,
  Rocket
} from 'lucide-react'

const STEPS = [
  {
    icon: Rocket,
    color: 'bg-brand',
    title: 'Welcome to QuoteMate',
    body: "You're all set up. Here's a quick tour of how QuoteMate helps you quote, send, track, and get paid — all from your phone."
  },
  {
    icon: FileText,
    color: 'bg-blue-500',
    title: '1. Create a quote',
    body: "Tap + New quote from the home screen. Add your customer's details, pick items from your pricing library or add custom ones, set scope and terms — done in under a minute."
  },
  {
    icon: Send,
    color: 'bg-indigo-500',
    title: '2. Send it to the customer',
    body: "Hit Send and your customer gets a professional branded email with a link to view, accept, or decline the quote. You can also copy the link or download a PDF."
  },
  {
    icon: CheckCircle2,
    color: 'bg-emerald-500',
    title: '3. Customer accepts',
    body: "When your customer accepts, you get an email notification and a Job is automatically created. No manual data entry — everything carries over from the quote."
  },
  {
    icon: Briefcase,
    color: 'bg-amber-500',
    title: '4. Track the job',
    body: "Move the job through stages: Scheduled → In Progress → Complete. Each status change can notify your customer by email so they always know where things are at."
  },
  {
    icon: Camera,
    color: 'bg-purple-500',
    title: '5. Capture progress',
    body: "Upload before, during, and after photos on each job. Great for showing the customer, resolving disputes, or just keeping a record of your work."
  },
  {
    icon: Calendar,
    color: 'bg-teal-500',
    title: '6. Stay on top of your week',
    body: "The Calendar shows all your upcoming jobs by date. Tap any day to see what's on. No more forgotten bookings or double-ups."
  }
]

export default function WalkthroughModal({ onDone }) {
  const [step, setStep] = useState(0)
  const current = STEPS[step]
  const isLast = step === STEPS.length - 1
  const Icon = current.icon

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center">
      <div className="bg-white w-full max-w-lg rounded-t-2xl sm:rounded-2xl overflow-hidden safe-bottom">
        {/* Progress bar */}
        <div className="flex gap-1 px-4 pt-4">
          {STEPS.map((_, i) => (
            <div
              key={i}
              className={`flex-1 h-1 rounded-full transition-colors ${
                i <= step ? 'bg-brand' : 'bg-slate-200'
              }`}
            />
          ))}
        </div>

        <div className="px-6 pt-6 pb-4 text-center">
          <div
            className={`w-16 h-16 rounded-2xl ${current.color} text-white flex items-center justify-center mx-auto mb-4`}
          >
            <Icon className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">
            {current.title}
          </h2>
          <p className="text-sm text-slate-600 leading-relaxed max-w-sm mx-auto">
            {current.body}
          </p>
        </div>

        <div className="px-4 pb-4 flex gap-2">
          {step > 0 && (
            <button
              onClick={() => setStep(step - 1)}
              className="btn-ghost !min-h-[44px] !px-3"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={() => (isLast ? onDone() : setStep(step + 1))}
            className="btn-primary flex-1"
          >
            {isLast ? "Let's go!" : 'Next'}
            {!isLast && <ChevronRight className="w-4 h-4" />}
          </button>
          {!isLast && (
            <button
              onClick={onDone}
              className="btn-ghost text-slate-400 !min-h-[44px] !px-3 text-sm"
            >
              Skip
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

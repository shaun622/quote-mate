import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Check, Zap, Crown } from 'lucide-react'
import { useBusiness } from '../../hooks/useBusiness.jsx'

const PLANS = [
  {
    id: 'basic',
    name: 'Basic',
    icon: Zap,
    monthlyPrice: 7,
    yearlyPrice: 50,
    features: [
      '10 quotes per month',
      'Send quotes via email',
      'Job tracking & status updates',
      'Customer notifications',
      'Pricing library',
      'Calendar view'
    ]
  },
  {
    id: 'unlimited',
    name: 'Unlimited',
    icon: Crown,
    monthlyPrice: 15,
    yearlyPrice: 150,
    popular: true,
    features: [
      'Unlimited quotes',
      'Everything in Basic',
      'Job photos',
      'PDF downloads',
      'Priority support',
      'Early access to new features'
    ]
  }
]

export default function Subscription() {
  const navigate = useNavigate()
  const { business } = useBusiness()
  const [billing, setBilling] = useState('monthly')

  const trialActive =
    business?.subscription_status === 'trial' &&
    new Date(business.trial_ends_at) > new Date()
  const trialDaysLeft = trialActive
    ? Math.ceil(
        (new Date(business.trial_ends_at).getTime() - Date.now()) / 86400000
      )
    : 0

  return (
    <div className="p-4 pb-24 space-y-4">
      <header className="flex items-center gap-2">
        <button
          onClick={() => navigate('/settings')}
          className="btn-ghost -ml-2 !min-h-0 !py-2 !px-2"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-xl font-bold flex-1">Choose your plan</h1>
      </header>

      {trialActive && (
        <div className="card bg-brand/5 border-brand/20">
          <div className="text-sm font-medium text-brand">
            Free trial — {trialDaysLeft} day{trialDaysLeft !== 1 ? 's' : ''} left
          </div>
          <p className="text-xs text-slate-600 mt-1">
            You have full access during your trial. Pick a plan to keep going after it ends.
          </p>
        </div>
      )}

      {/* Billing toggle */}
      <div className="flex justify-center">
        <div className="inline-flex bg-slate-100 rounded-lg p-1">
          <button
            onClick={() => setBilling('monthly')}
            className={`px-4 py-2 text-sm font-medium rounded-md transition ${
              billing === 'monthly'
                ? 'bg-white shadow text-slate-900'
                : 'text-slate-500'
            }`}
          >
            Monthly
          </button>
          <button
            onClick={() => setBilling('yearly')}
            className={`px-4 py-2 text-sm font-medium rounded-md transition ${
              billing === 'yearly'
                ? 'bg-white shadow text-slate-900'
                : 'text-slate-500'
            }`}
          >
            Yearly
            <span className="ml-1.5 text-[11px] font-semibold text-emerald-600">Save</span>
          </button>
        </div>
      </div>

      {/* Plan cards */}
      <div className="space-y-4">
        {PLANS.map((plan) => {
          const price =
            billing === 'monthly' ? plan.monthlyPrice : plan.yearlyPrice
          const period = billing === 'monthly' ? '/mo' : '/yr'
          const isCurrentPlan =
            business?.subscription_status === 'active' &&
            business?.plan_id === plan.id

          return (
            <div
              key={plan.id}
              className={`card relative ${
                plan.popular
                  ? '!border-brand ring-1 ring-brand/20'
                  : ''
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-4 bg-brand text-white text-[11px] font-semibold uppercase tracking-wide px-2.5 py-0.5 rounded-full">
                  Most popular
                </div>
              )}
              <div className="flex items-start gap-3 mb-4">
                <div
                  className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    plan.popular
                      ? 'bg-brand text-white'
                      : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  <plan.icon className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <h2 className="font-bold text-lg">{plan.name}</h2>
                  <div className="flex items-baseline gap-1 mt-0.5">
                    <span className="text-2xl font-bold text-brand">
                      ${price}
                    </span>
                    <span className="text-sm text-slate-500">{period}</span>
                  </div>
                  {billing === 'yearly' && (
                    <div className="text-xs text-emerald-600 font-medium mt-0.5">
                      Save ${plan.monthlyPrice * 12 - plan.yearlyPrice}/yr vs monthly
                    </div>
                  )}
                </div>
              </div>

              <ul className="space-y-2 mb-4">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm">
                    <Check className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                    <span className="text-slate-700">{f}</span>
                  </li>
                ))}
              </ul>

              <button
                disabled
                className={`w-full ${
                  plan.popular ? 'btn-primary' : 'btn-secondary'
                } opacity-75`}
              >
                {isCurrentPlan ? 'Current plan' : 'Coming soon'}
              </button>
            </div>
          )
        })}
      </div>

      <p className="text-xs text-slate-400 text-center px-4">
        All prices in AUD. GST included. Cancel anytime.
        Stripe payments will be connected soon.
      </p>
    </div>
  )
}

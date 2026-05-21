'use client'

import * as React from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { 
  Check, 
  CreditCard, 
  Info, 
  Sparkles, 
  Zap, 
  Calendar, 
  ShieldCheck, 
  ArrowRight,
  ChevronRight,
  Wallet,
  Building2,
  Users
} from 'lucide-react'

import { PaddleCheckoutButton } from '@/components/billing/paddle-checkout-button'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  BILLING_DASHBOARD_PATH,
  clearBillingAccess,
  readBillingAccessState,
  setBillingAccess,
} from '@/lib/billing'
import { BILLING_PLAN_DEFINITIONS, BILLING_PLAN_ORDER } from '@/lib/billing-plans'
import { cn } from '@/lib/utils'

const PLANS = BILLING_PLAN_ORDER.map((planId) => BILLING_PLAN_DEFINITIONS[planId])

const USAGE_STATS = [
  {
    label: 'Credits Used',
    value: '3,120',
    total: '5,000',
    icon: Sparkles,
    meta: 'Resets in 12 days',
  },
  {
    label: 'Workspace Seats',
    value: '4',
    total: '10',
    icon: Users,
    meta: '1 owner, 3 collaborators',
  },
]

export function BillingDashboard() {
  const searchParams = useSearchParams()
  const nextPath = searchParams.get('next')
  const [billingState, setBillingState] = React.useState(readBillingAccessState)
  const usedCredits = 3120
  const totalCredits = 5000
  const progressValue = (usedCredits / totalCredits) * 100
  
  const currentPlan = PLANS.find((plan) => plan.id === billingState.planId) || null
  const hasAccess = billingState.status === 'active'

  const refreshBillingState = React.useCallback(() => {
    setBillingState(readBillingAccessState())
  }, [])

  React.useEffect(() => {
    const handleFocus = () => refreshBillingState()
    const handleStorage = () => refreshBillingState()
    window.addEventListener('focus', handleFocus)
    window.addEventListener('storage', handleStorage)
    return () => {
      window.removeEventListener('focus', handleFocus)
      window.removeEventListener('storage', handleStorage)
    }
  }, [refreshBillingState])

  return (
    <div className="mx-auto max-w-7xl space-y-12 px-4 py-8 md:px-8 md:py-12">
      {/* 1. Header & Current Subscription */}
      <div className="grid gap-8 lg:grid-cols-[1fr_400px]">
        <div className="flex flex-col justify-center space-y-4">
          <div className="inline-flex items-center gap-2 text-sm font-medium text-white/40">
            <Building2 className="size-4" />
            <span>Workspace Management</span>
            <ChevronRight className="size-3" />
            <span className="text-white/80">Billing & Plans</span>
          </div>
          <h1 className="text-4xl font-semibold tracking-tight text-white md:text-5xl">
            Upgrade your production capability.
          </h1>
          <p className="max-w-xl text-lg text-white/50">
            Manage your workspace subscription and unlock high-performance AI video editing features.
          </p>
          
          {hasAccess && nextPath && (
            <div className="pt-4">
              <Button asChild size="lg" className="rounded-full bg-white text-black hover:bg-white/90">
                <Link href={nextPath}>
                  Return to Editor <ArrowRight className="ml-2 size-4" />
                </Link>
              </Button>
            </div>
          )}
        </div>

        <Card className="relative overflow-hidden border-white/10 bg-white/[0.02]">
          <div className="absolute -right-12 -top-12 size-48 rounded-full bg-blue-500/10 blur-3xl" />
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-base font-medium text-white/70">
                <ShieldCheck className="size-4 text-blue-400" />
                Current Plan
              </CardTitle>
              <Badge 
                variant={hasAccess ? "default" : "outline"} 
                className={cn(
                  "rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider",
                  hasAccess 
                    ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" 
                    : "bg-white/5 text-white/40 border-white/10"
                )}
              >
                {hasAccess ? 'Active' : 'Unpaid'}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <div className="text-3xl font-semibold tracking-tight text-white">
                {hasAccess && currentPlan ? currentPlan.name : 'Free Trial'}
              </div>
              <div className="mt-1 flex items-center gap-2 text-sm text-white/40">
                <Calendar className="size-3.5" />
                <span>Next billing date: May 12, 2026</span>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs font-medium uppercase tracking-wider text-white/40">
                <span>Monthly Credits</span>
                <span className="text-white/70">{usedCredits.toLocaleString()} / {totalCredits.toLocaleString()}</span>
              </div>
              <Progress value={progressValue} className="h-1.5" />
              <p className="text-[11px] leading-relaxed text-white/30">
                Credits reset on your next billing cycle. Additional usage will be billed at the standard rate.
              </p>
            </div>
          </CardContent>
          <CardFooter className="border-t border-white/5 bg-white/[0.01] pt-4">
            <Button variant="ghost" size="sm" className="w-full text-white/40 hover:text-white hover:bg-white/5">
              View usage history
            </Button>
          </CardFooter>
        </Card>
      </div>

      {/* 2. Pricing Plans Section */}
      <div className="space-y-8">
        <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
          <div className="space-y-1">
            <h2 className="text-2xl font-semibold text-white">Choose your plan</h2>
            <p className="text-sm text-white/40">Scale your production with predictable pricing.</p>
          </div>
          
          <Tabs defaultValue="monthly" className="w-auto">
            <TabsList className="bg-white/5 p-1 border-white/10">
              <TabsTrigger value="monthly" className="rounded-lg text-xs font-semibold uppercase tracking-wider">Monthly</TabsTrigger>
              <TabsTrigger value="yearly" className="rounded-lg text-xs font-semibold uppercase tracking-wider">
                Yearly <span className="ml-1 text-[10px] text-blue-400">-20%</span>
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {PLANS.map((plan) => {
            const isCurrent = billingState.planId === plan.id
            
            return (
              <Card 
                key={plan.id}
                className={cn(
                  "group relative flex flex-col transition-all duration-300 hover:border-white/20 hover:shadow-2xl",
                  plan.featured ? "border-blue-500/30 bg-blue-500/[0.02]" : "border-white/10 bg-white/[0.01]"
                )}
              >
                {plan.featured && (
                  <div className="absolute inset-x-0 -top-px flex justify-center">
                    <div className="rounded-b-xl bg-blue-500 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-white shadow-lg">
                      Recommended
                    </div>
                  </div>
                )}
                
                <CardHeader className="pt-8">
                  <div className="space-y-1">
                    <CardTitle className="text-xl font-semibold text-white">{plan.name}</CardTitle>
                    <CardDescription className="text-sm text-white/40">Full control over your assets.</CardDescription>
                  </div>
                  <div className="mt-6 flex items-baseline gap-1">
                    <span className="text-4xl font-semibold tracking-tight text-white">{plan.priceWhole}</span>
                    <span className="text-lg font-medium text-white/40">{plan.priceFraction}</span>
                    <span className="ml-1 text-sm text-white/40">{plan.monthlyLabel}</span>
                  </div>
                </CardHeader>
                
                <CardContent className="flex-1 pb-8">
                  <div className="mb-8 flex items-center gap-3 rounded-2xl border border-white/5 bg-white/[0.03] p-3">
                    <div className="flex size-8 items-center justify-center rounded-xl bg-blue-500/20 text-blue-400">
                      <Sparkles className="size-4" />
                    </div>
                    <div className="text-sm font-medium text-white/80">{plan.creditsLabel}</div>
                  </div>
                  
                  <ul className="space-y-4">
                    {plan.features.map((feature, i) => (
                      <li key={i} className="flex items-start gap-3">
                        <div className="mt-1 flex size-4 items-center justify-center rounded-full bg-blue-500/10 text-blue-400">
                          <Check className="size-2.5" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className={cn(
                            "text-sm leading-snug",
                            feature.emphasized ? "font-medium text-white/90" : "text-white/60"
                          )}>
                            {feature.label}
                          </p>
                          {feature.hint && (
                            <p className="mt-0.5 text-xs text-white/30">{feature.hint}</p>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                </CardContent>
                
                <CardFooter className="pt-0">
                  {isCurrent ? (
                    <Button disabled className="w-full rounded-2xl border border-white/10 bg-white/5 text-white/40">
                      Current Plan
                    </Button>
                  ) : plan.contactOnly ? (
                    <Button asChild className="w-full rounded-2xl bg-white text-black hover:bg-white/90">
                      <a href="mailto:sales@prometheus.ai?subject=Inquiry: Cinema Plan">
                        Contact Sales
                      </a>
                    </Button>
                  ) : (
                    <PaddleCheckoutButton 
                      planId={plan.id} 
                      nextPath={nextPath} 
                      ctaLabel={plan.ctaLabel} 
                      className="rounded-2xl"
                    />
                  )}
                </CardFooter>
              </Card>
            )
          })}
        </div>
      </div>

      {/* 3. Actions & Payment Panel */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card className="border-white/10 bg-white/[0.01]">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg font-medium text-white">
              <Wallet className="size-4 text-white/40" />
              Payment Method
            </CardTitle>
            <CardDescription>Manage how you pay for your subscription.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between rounded-2xl border border-white/5 bg-white/[0.02] p-4">
              <div className="flex items-center gap-4">
                <div className="flex h-10 w-14 items-center justify-center rounded-lg border border-white/10 bg-white/[0.05]">
                  <CreditCard className="size-5 text-white/60" />
                </div>
                <div>
                  <div className="text-sm font-medium text-white">Visa ending in 4242</div>
                  <div className="text-xs text-white/30">Expires 12/26</div>
                </div>
              </div>
              <Button variant="ghost" size="sm" className="text-xs text-white/40 hover:text-white">
                Edit
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="border-white/10 bg-white/[0.01]">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg font-medium text-white">
              <Zap className="size-4 text-white/40" />
              Quick Actions
            </CardTitle>
            <CardDescription>Advanced subscription and account controls.</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-3">
            <Button variant="outline" className="h-20 flex-col items-center justify-center gap-2 rounded-2xl border-white/5 bg-white/[0.02] hover:bg-white/5">
              <Calendar className="size-4 text-white/40" />
              <span className="text-xs">Billing History</span>
            </Button>
            <Button 
              variant="outline" 
              className="h-20 flex-col items-center justify-center gap-2 rounded-2xl border-white/5 bg-white/[0.02] hover:bg-white/5"
              onClick={() => {
                if (window.confirm('Are you sure you want to cancel? You will lose access at the end of your period.')) {
                  // Logic handled via Paddle portal usually
                }
              }}
            >
              <ShieldCheck className="size-4 text-white/40" />
              <span className="text-xs">Cancel Plan</span>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Dev Tools Shortcut */}
      {process.env.NODE_ENV === 'development' && (
        <div className="mt-20 border-t border-white/5 pt-12 text-center">
          <Badge variant="outline" className="mb-6 rounded-full border-white/5 bg-white/[0.02] px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-white/20">
            Developer Console
          </Badge>
          <div className="flex flex-wrap justify-center gap-3">
            {PLANS.map((plan) => (
              <Button
                key={`unlock-${plan.id}`}
                variant="ghost"
                size="sm"
                className="rounded-full text-xs text-white/30 hover:text-white"
                onClick={() => {
                  setBillingAccess(plan.id, 'demo')
                  refreshBillingState()
                }}
              >
                Mock {plan.name}
              </Button>
            ))}
            <Button
              variant="ghost"
              size="sm"
              className="rounded-full text-xs text-white/30 hover:text-red-400"
              onClick={() => {
                clearBillingAccess()
                refreshBillingState()
              }}
            >
              Reset All
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

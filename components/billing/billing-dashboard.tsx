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
  Users,
  History,
  XCircle
} from 'lucide-react'
import { motion } from 'framer-motion'

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
        <div className="flex flex-col justify-center space-y-6">
          <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-white/30">
            <Building2 className="size-3.5" />
            <span>Workspace</span>
            <ChevronRight className="size-3 opacity-50" />
            <span className="text-blue-400/80">Billing & Plans</span>
          </div>
          <div className="space-y-4">
            <h1 className="text-4xl font-bold tracking-tight text-white md:text-6xl">
              Production <span className="text-transparent bg-clip-text bg-[linear-gradient(90deg,#60a5fa,#3b82f6)]">Capability.</span>
            </h1>
            <p className="max-w-xl text-lg leading-relaxed text-white/50">
              Scale your creative output with high-performance AI editing. Manage your workspace access and subscription details below.
            </p>
          </div>
          
          {hasAccess && nextPath && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="pt-2"
            >
              <Button asChild size="lg" className="h-12 rounded-[18px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.08)_0%,rgba(255,255,255,0.02)_100%)] px-8 text-[15px] font-semibold text-white shadow-[0_2px_10px_-4px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.15)] hover:border-white/25 hover:bg-[linear-gradient(180deg,rgba(255,255,255,0.12)_0%,rgba(255,255,255,0.04)_100%)] hover:shadow-[0_8px_20px_-6px_rgba(0,0,0,0.6),inset_0_1px_0_rgba(255,255,255,0.2)] transition-all">
                <Link href={nextPath} className="flex items-center gap-2">
                  Return to Editor <ArrowRight className="size-4" />
                </Link>
              </Button>
            </motion.div>
          )}
        </div>

        <Card className="relative overflow-hidden border-white/10 bg-white/[0.03] shadow-[var(--glass-shadow-lg)]">
          <div className="absolute -right-20 -top-20 size-64 rounded-full bg-blue-600/10 blur-[100px]" />
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-white/40">
                <ShieldCheck className="size-4 text-blue-400" />
                Status
              </CardTitle>
              <Badge 
                variant={hasAccess ? "default" : "outline"} 
                className={cn(
                  "rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-tighter",
                  hasAccess 
                    ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" 
                    : "bg-white/5 text-white/40 border-white/10"
                )}
              >
                {hasAccess ? 'Active' : 'Awaiting Payment'}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-8">
            <div>
              <div className="text-4xl font-bold tracking-tighter text-white">
                {hasAccess && currentPlan ? currentPlan.name : 'Free Tier'}
              </div>
              <div className="mt-2 flex items-center gap-2 text-sm text-white/30">
                <Calendar className="size-4" />
                <span>Next renewal: May 12, 2026</span>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between text-[11px] font-black uppercase tracking-[0.1em] text-white/30">
                <span>Monthly Credits</span>
                <span className="text-white/60">{usedCredits.toLocaleString()} / {totalCredits.toLocaleString()}</span>
              </div>
              <div className="relative h-2 w-full overflow-hidden rounded-full bg-white/5">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${progressValue}%` }}
                  transition={{ duration: 1, ease: "circOut" }}
                  className="h-full bg-[linear-gradient(90deg,#3b82f6,#60a5fa)]"
                />
              </div>
              <p className="text-[12px] leading-relaxed text-white/30">
                Credits reset automatically. Usage beyond your limit is billed at $0.05/credit.
              </p>
            </div>
          </CardContent>
          <CardFooter className="border-t border-white/5 bg-white/[0.01] p-0">
            <Button variant="ghost" className="h-12 w-full rounded-none text-xs font-bold uppercase tracking-widest text-white/20 hover:bg-white/[0.04] hover:text-white/60 transition-all">
              <History className="mr-2 size-3.5" />
              Usage History
            </Button>
          </CardFooter>
        </Card>
      </div>

      {/* 2. Pricing Plans Section */}
      <div className="space-y-8">
        <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
          <div className="space-y-2 text-center md:text-left">
            <h2 className="text-3xl font-bold tracking-tight text-white">Choose your plan</h2>
            <p className="text-base text-white/40">Scale your production with predictable, high-value pricing.</p>
          </div>
          
          <Tabs defaultValue="monthly" className="w-auto">
            <TabsList className="h-11 bg-white/5 p-1 border border-white/10 rounded-[14px]">
              <TabsTrigger value="monthly" className="rounded-[10px] px-6 text-xs font-bold uppercase tracking-widest">Monthly</TabsTrigger>
              <TabsTrigger value="yearly" className="rounded-[10px] px-6 text-xs font-bold uppercase tracking-widest">
                Yearly <span className="ml-1 text-[10px] text-emerald-400">Save 20%</span>
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        <div className="grid gap-8 lg:grid-cols-3">
          {PLANS.map((plan) => {
            const isCurrent = billingState.planId === plan.id
            
            return (
              <Card 
                key={plan.id}
                className={cn(
                  "group relative flex flex-col border-white/10 bg-white/[0.02] transition-all duration-500 hover:bg-white/[0.03]",
                  plan.featured ? "border-blue-500/30 ring-1 ring-blue-500/10" : "hover:border-white/20"
                )}
              >
                {plan.featured && (
                  <div className="absolute inset-x-0 -top-px flex justify-center">
                    <div className="rounded-b-2xl bg-blue-600 px-4 py-1.5 text-[10px] font-black uppercase tracking-[0.2em] text-white shadow-[0_4px_20px_rgba(37,99,235,0.4)]">
                      Recommended
                    </div>
                  </div>
                )}
                
                <CardHeader className="pt-10 space-y-6">
                  <div className="space-y-2">
                    <CardTitle className="text-2xl font-bold tracking-tight text-white">{plan.name}</CardTitle>
                    <CardDescription className="text-[15px] text-white/40 leading-relaxed">Everything needed for professional output.</CardDescription>
                  </div>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-5xl font-bold tracking-tighter text-white">{plan.priceWhole}</span>
                    <div className="flex flex-col">
                       <span className="text-xl font-bold text-white/40 leading-none">{plan.priceFraction}</span>
                       <span className="text-[11px] font-black uppercase tracking-widest text-white/20">{plan.monthlyLabel.replace('/', '').trim()}</span>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="flex-1 pb-10">
                  <div className="mb-8 flex items-center gap-3 rounded-[20px] border border-white/5 bg-white/[0.03] p-4 group-hover:bg-white/[0.05] transition-colors">
                    <div className="flex size-10 items-center justify-center rounded-[14px] bg-blue-500/20 text-blue-400">
                      <Sparkles className="size-5" />
                    </div>
                    <div>
                      <div className="text-[13px] font-bold text-white/90">{plan.creditsLabel}</div>
                      <div className="text-[10px] font-black uppercase tracking-widest text-white/20">Monthly limit</div>
                    </div>
                  </div>
                  
                  <ul className="space-y-5">
                    {plan.features.map((feature, i) => (
                      <li key={i} className="flex items-start gap-4">
                        <div className="mt-1 flex size-5 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-400/80">
                          <Check className="size-3 stroke-[3]" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className={cn(
                            "text-[15px] leading-tight",
                            feature.emphasized ? "font-bold text-white" : "text-white/60"
                          )}>
                            {feature.label}
                          </p>
                          {feature.hint && (
                            <p className="mt-1 text-xs text-white/30 leading-normal">{feature.hint}</p>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                </CardContent>
                
                <CardFooter className="pt-0">
                  {isCurrent ? (
                    <Button disabled className="h-12 w-full rounded-[18px] border border-white/10 bg-white/5 text-[15px] font-bold text-white/20">
                      Current Plan
                    </Button>
                  ) : plan.contactOnly ? (
                    <Button asChild className="h-12 w-full rounded-[18px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.08)_0%,rgba(255,255,255,0.02)_100%)] text-[15px] font-semibold text-white shadow-[0_2px_10px_-4px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.15)] hover:border-white/25 hover:bg-[linear-gradient(180deg,rgba(255,255,255,0.12)_0%,rgba(255,255,255,0.04)_100%)] hover:shadow-[0_8px_20px_-6px_rgba(0,0,0,0.6),inset_0_1px_0_rgba(255,255,255,0.2)] transition-all">
                      <a href="mailto:sales@prometheus.ai?subject=Inquiry: Cinema Plan">
                        Contact Sales
                      </a>
                    </Button>
                  ) : (
                    <PaddleCheckoutButton 
                      planId={plan.id} 
                      nextPath={nextPath} 
                      ctaLabel={plan.ctaLabel} 
                      className="rounded-[18px]"
                    />
                  )}
                </CardFooter>
              </Card>
            )
          })}
        </div>
      </div>

      {/* 3. Actions & Payment Panel */}
      <div className="grid gap-8 md:grid-cols-2">
        <Card className="border-white/10 bg-white/[0.015] shadow-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-lg font-bold text-white">
              <div className="grid size-8 place-items-center rounded-xl bg-white/5">
                <Wallet className="size-4 text-white/40" />
              </div>
              Payment Method
            </CardTitle>
            <CardDescription className="text-white/40">Manage your default payment provider.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between rounded-2xl border border-white/5 bg-black/20 p-5 hover:border-white/10 transition-colors">
              <div className="flex items-center gap-4">
                <div className="flex h-11 w-16 items-center justify-center rounded-xl border border-white/10 bg-white/[0.03]">
                  <CreditCard className="size-6 text-white/60" />
                </div>
                <div>
                  <div className="text-[15px] font-bold text-white tracking-tight">Visa •••• 4242</div>
                  <div className="text-xs font-medium text-white/20 uppercase tracking-widest mt-0.5">Expires 12/2026</div>
                </div>
              </div>
              <Button variant="ghost" size="sm" className="h-9 px-4 rounded-xl text-xs font-bold uppercase tracking-widest text-blue-400 hover:bg-blue-400/10 transition-all">
                Update
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="border-white/10 bg-white/[0.015] shadow-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-lg font-bold text-white">
               <div className="grid size-8 place-items-center rounded-xl bg-white/5">
                <Zap className="size-4 text-white/40" />
              </div>
              Quick Actions
            </CardTitle>
            <CardDescription className="text-white/40">Subscription and account management.</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
            <Button variant="outline" className="h-24 flex-col items-center justify-center gap-3 rounded-2xl border-white/5 bg-white/[0.02] hover:bg-white/[0.05] hover:border-white/10 transition-all group">
              <div className="grid size-10 place-items-center rounded-full bg-white/5 group-hover:bg-blue-400/10 transition-colors">
                <Calendar className="size-5 text-white/30 group-hover:text-blue-400 transition-colors" />
              </div>
              <span className="text-[11px] font-black uppercase tracking-[0.1em] text-white/40 group-hover:text-white transition-colors">Billing History</span>
            </Button>
            <Button 
              variant="outline" 
              className="h-24 flex-col items-center justify-center gap-3 rounded-2xl border-white/5 bg-white/[0.02] hover:bg-red-400/[0.03] hover:border-red-400/20 transition-all group"
              onClick={() => {
                if (window.confirm('Are you sure you want to cancel? You will lose access at the end of your period.')) {
                  // Logic handled via Paddle portal usually
                }
              }}
            >
              <div className="grid size-10 place-items-center rounded-full bg-white/5 group-hover:bg-red-400/10 transition-colors">
                <XCircle className="size-5 text-white/30 group-hover:text-red-400 transition-colors" />
              </div>
              <span className="text-[11px] font-black uppercase tracking-[0.1em] text-white/40 group-hover:text-red-400 transition-colors">Cancel Plan</span>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Dev Tools Shortcut */}
      {process.env.NODE_ENV === 'development' && (
        <div className="mt-24 border-t border-white/5 pt-16 text-center">
          <Badge variant="outline" className="mb-8 rounded-full border-white/10 bg-white/[0.02] px-4 py-1.5 text-[10px] font-black uppercase tracking-[0.3em] text-white/20">
            Dev Override Console
          </Badge>
          <div className="flex flex-wrap justify-center gap-4">
            {PLANS.map((plan) => (
              <Button
                key={`unlock-${plan.id}`}
                variant="ghost"
                size="sm"
                className="h-10 rounded-full px-6 text-[11px] font-bold uppercase tracking-widest text-white/30 hover:bg-white/5 hover:text-blue-400 transition-all"
                onClick={() => {
                  setBillingAccess(plan.id, 'demo')
                  refreshBillingState()
                }}
              >
                Simulate {plan.name}
              </Button>
            ))}
            <Button
              variant="ghost"
              size="sm"
              className="h-10 rounded-full px-6 text-[11px] font-bold uppercase tracking-widest text-white/30 hover:bg-red-500/10 hover:text-red-400 transition-all"
              onClick={() => {
                clearBillingAccess()
                refreshBillingState()
              }}
            >
              Reset Access
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

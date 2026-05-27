'use client'

import * as React from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { 
  CreditCard, 
  Zap, 
  Calendar, 
  ShieldCheck, 
  ArrowRight,
  ChevronRight,
  Wallet,
  Building2,
  History,
  XCircle,
  Loader2,
  Download,
  Database
} from 'lucide-react'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import { initializePaddle, type Paddle } from '@paddle/paddle-js'

import { PaddleCheckoutButton } from '@/components/billing/paddle-checkout-button'
import { PremiumPricingPlans } from '@/components/premium-pricing-plans'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog"

import { BILLING_PLAN_DEFINITIONS, BILLING_PLAN_ORDER } from '@/lib/billing-plans'
import { cn, formatBytes } from '@/lib/utils'
import { useBillingData } from '@/hooks/use-billing-data'

const PLANS = BILLING_PLAN_ORDER.map((planId) => BILLING_PLAN_DEFINITIONS[planId])

export function BillingDashboard() {
  const searchParams = useSearchParams()
  const nextPath = searchParams.get('next')
  const { subscription, usage, invoices, isLoading, error, refresh } = useBillingData()
  
  const [paddle, setPaddle] = React.useState<Paddle>()
  const [isUpdatingPayment, setIsUpdatingPayment] = React.useState(false)
  const [isCancelling, setIsCancelling] = React.useState(false)

  React.useEffect(() => {
    const token = process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN
    const env = (process.env.NEXT_PUBLIC_PADDLE_ENVIRONMENT as any) || 'sandbox'
    
    if (token) {
      initializePaddle({ 
        environment: env, 
        token: token,
        checkout: {
          settings: {
            displayMode: 'overlay',
            theme: 'dark',
          }
        }
      }).then((instance) => {
        if (instance) setPaddle(instance)
      })
    }
  }, [])

  if (error) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center space-y-4 rounded-3xl border border-white/10 bg-white/[0.02] p-12 text-center">
        <XCircle className="size-12 text-red-400/50" />
        <div className="space-y-2">
          <h3 className="text-xl font-bold text-white">Unable to load billing data</h3>
          <p className="max-w-md text-sm text-white/40">{error}</p>
        </div>
        <Button variant="outline" onClick={() => window.location.reload()}>
          Try Again
        </Button>
      </div>
    )
  }

  if (isLoading) {
    return <BillingDashboardSkeleton />
  }

  const hasAccess = subscription?.status === 'active' || subscription?.status === 'trialing'
  const currentPlan = PLANS.find((plan) => plan.id === subscription?.plan_id) || null
  const nextBillingDate = subscription?.next_billing_date 
    ? new Intl.DateTimeFormat('en-US', { dateStyle: 'long' }).format(new Date(subscription.next_billing_date))
    : 'N/A'

  const renderProgress = (usage.renders / (usage.renderLimit || 1)) * 100
  const storageProgress = (usage.storageBytes / (usage.storageLimit || 1)) * 100

  const handleUpdatePayment = async () => {
    if (!paddle || !subscription?.paddle_subscription_id) return
    
    setIsUpdatingPayment(true)
    try {
      const options: any = {
        subscriptionId: subscription.paddle_subscription_id,
        settings: {
          displayMode: 'overlay',
          theme: 'dark',
        }
      }
      paddle.Checkout.open(options)
    } catch (err) {
      toast.error('Failed to open payment update.')
    } finally {
      setIsUpdatingPayment(false)
    }
  }

  const handleCancelSubscription = async () => {
    setIsCancelling(true)
    try {
      const response = await fetch('/api/billing/cancel', { method: 'POST' })
      if (response.ok) {
        toast.success('Subscription cancelled. You will have access until the end of your period.')
        refresh()
      } else {
        const data = await response.json()
        throw new Error(data.error || 'Failed to cancel')
      }
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setIsCancelling(false)
    }
  }

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
                {hasAccess ? (subscription?.status === 'trialing' ? 'Trial' : 'Active') : 'Inactive'}
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
                <span>Next renewal: {nextBillingDate}</span>
              </div>
            </div>

            <div className="space-y-6">
              <div className="space-y-3">
                <div className="flex items-center justify-between text-[11px] font-black uppercase tracking-[0.1em] text-white/30">
                  <span className="flex items-center gap-1.5"><Zap className="size-3" /> Monthly Credits</span>
                  <span className="text-white/60">{usage.renders.toLocaleString()} / {usage.renderLimit.toLocaleString()}</span>
                </div>
                <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-white/5">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(renderProgress, 100)}%` }}
                    transition={{ duration: 1, ease: "circOut" }}
                    className={cn(
                      "h-full transition-colors duration-500",
                      renderProgress > 90 ? "bg-red-500" : "bg-[linear-gradient(90deg,#3b82f6,#60a5fa)]"
                    )}
                  />
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between text-[11px] font-black uppercase tracking-[0.1em] text-white/30">
                  <span className="flex items-center gap-1.5"><Database className="size-3" /> Media Storage</span>
                  <span className="text-white/60">{formatBytes(usage.storageBytes)} / {formatBytes(usage.storageLimit)}</span>
                </div>
                <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-white/5">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(storageProgress, 100)}%` }}
                    transition={{ duration: 1, ease: "circOut" }}
                    className={cn(
                      "h-full transition-colors duration-500",
                      storageProgress > 90 ? "bg-red-500" : "bg-[linear-gradient(90deg,#3b82f6,#60a5fa)]"
                    )}
                  />
                </div>
              </div>
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
        <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
          <div className="space-y-3 text-center md:text-left">
            <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-white/36">
              PRICING
            </p>
            <h2 className="text-3xl font-semibold text-white md:text-4xl">Choose your plan</h2>
            <p className="max-w-2xl text-base leading-7 text-white/52">
              Premium AI video infrastructure with monthly pricing, cloud-backed storage, and export-ready rendering workflows.
            </p>
          </div>
          <div className="mx-auto rounded-full border border-white/[0.08] bg-white/[0.03] px-4 py-2 text-xs font-medium text-white/54 md:mx-0">
            Monthly billing
          </div>
        </div>

        <PremiumPricingPlans
          compact
          renderCta={(plan, context) => {
            const isCurrent = subscription?.plan_id === plan.id

            if (isCurrent) {
              return (
                <Button
                  disabled
                  aria-label={`Current plan: ${plan.name}`}
                  className={cn(
                    context.buttonClassName,
                    'pointer-events-none border-white/10 bg-white/[0.045] text-white/34 shadow-none',
                  )}
                >
                  Current Plan
                </Button>
              )
            }

            return (
              <PaddleCheckoutButton
                planId={plan.id}
                nextPath={nextPath}
                ctaLabel={context.ctaLabel}
                className={context.buttonClassName}
              />
            )
          }}
        />
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
            {subscription?.card_last_4 ? (
              <div className="flex items-center justify-between rounded-2xl border border-white/5 bg-black/20 p-5 hover:border-white/10 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="flex h-11 w-16 items-center justify-center rounded-xl border border-white/10 bg-white/[0.03]">
                    <CreditCard className="size-6 text-white/60" />
                  </div>
                  <div>
                    <div className="text-[15px] font-bold text-white tracking-tight">
                      {subscription.card_brand} •••• {subscription.card_last_4}
                    </div>
                    <div className="text-xs font-medium text-white/20 uppercase tracking-widest mt-0.5">
                      Expires {subscription.card_expiry_month}/{subscription.card_expiry_year}
                    </div>
                  </div>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-9 px-4 rounded-xl text-xs font-bold uppercase tracking-widest text-blue-400 hover:bg-blue-400/10 transition-all"
                  onClick={handleUpdatePayment}
                  disabled={isUpdatingPayment}
                >
                  {isUpdatingPayment ? <Loader2 className="size-3 animate-spin" /> : 'Update'}
                </Button>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center space-y-4 rounded-2xl border border-dashed border-white/10 bg-white/[0.01] p-8 text-center">
                <CreditCard className="size-8 text-white/10" />
                <p className="text-sm text-white/30">No payment method on file. Subscribe to a plan to add one.</p>
              </div>
            )}
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
                <History className="size-5 text-white/30 group-hover:text-blue-400 transition-colors" />
              </div>
              <span className="text-[11px] font-black uppercase tracking-[0.1em] text-white/40 group-hover:text-white transition-colors">Billing History</span>
            </Button>
            
            <Dialog>
              <DialogTrigger asChild>
                <Button 
                  variant="outline" 
                  disabled={!hasAccess || isCancelling}
                  className="h-24 flex-col items-center justify-center gap-3 rounded-2xl border-white/5 bg-white/[0.02] hover:bg-red-400/[0.03] hover:border-red-400/20 transition-all group"
                >
                  <div className="grid size-10 place-items-center rounded-full bg-white/5 group-hover:bg-red-400/10 transition-colors">
                    <XCircle className="size-5 text-white/30 group-hover:text-red-400 transition-colors" />
                  </div>
                  <span className="text-[11px] font-black uppercase tracking-[0.1em] text-white/40 group-hover:text-red-400 transition-colors">
                    {isCancelling ? <Loader2 className="size-3 animate-spin" /> : 'Cancel Plan'}
                  </span>
                </Button>
              </DialogTrigger>
              <DialogContent className="border-white/10 bg-[#0a0a0b] text-white">
                <DialogHeader>
                  <DialogTitle className="text-xl font-bold">Are you absolutely sure?</DialogTitle>
                  <DialogDescription className="text-white/50">
                    This will cancel your subscription at the end of the current billing period. You will retain access until then, but your plan will not renew.
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <DialogClose asChild>
                    <Button variant="ghost" className="border-white/10 bg-transparent text-white hover:bg-white/5">Keep Subscription</Button>
                  </DialogClose>
                  <Button 
                    variant="destructive"
                    onClick={handleCancelSubscription}
                    className="bg-red-500 text-white hover:bg-red-600"
                  >
                    Confirm Cancellation
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>
      </div>

      {/* 4. Billing History / Invoices */}
      {invoices.length > 0 && (
        <Card className="border-white/10 bg-white/[0.015] shadow-xl">
          <CardHeader>
            <CardTitle className="text-lg font-bold text-white">Billing History</CardTitle>
            <CardDescription className="text-white/40">Download past invoices and receipts.</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-white/60">
                <thead className="border-b border-white/5 text-xs font-black uppercase tracking-widest text-white/20">
                  <tr>
                    <th className="px-6 py-4">Date</th>
                    <th className="px-6 py-4">Amount</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-right">Receipt</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {invoices.map((invoice) => (
                    <tr key={invoice.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="px-6 py-4">{new Date(invoice.date).toLocaleDateString()}</td>
                      <td className="px-6 py-4 font-bold text-white">{invoice.currency} {invoice.amount}</td>
                      <td className="px-6 py-4">
                        <Badge variant="outline" className="rounded-full bg-emerald-500/10 text-[10px] text-emerald-400 border-emerald-500/20">
                          {invoice.status}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-right">
                        {invoice.receiptUrl && (
                          <Button variant="ghost" size="sm" asChild className="h-8 rounded-lg text-blue-400 hover:bg-blue-400/10">
                            <a href={invoice.receiptUrl} target="_blank" rel="noopener noreferrer">
                              <Download className="mr-2 size-3.5" />
                              Download
                            </a>
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Dev Tools Shortcut */}
      {process.env.NODE_ENV === 'development' && (
        <div className="mt-24 border-t border-white/5 pt-16 text-center">
          <Badge variant="outline" className="mb-8 rounded-full border-white/10 bg-white/[0.02] px-4 py-1.5 text-[10px] font-black uppercase tracking-[0.3em] text-white/20">
            Dev Tools
          </Badge>
          <div className="flex flex-wrap justify-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              className="h-10 rounded-full px-6 text-[11px] font-bold uppercase tracking-widest text-white/30 hover:bg-white/5 hover:text-blue-400 transition-all"
              onClick={() => refresh()}
            >
              Refresh Real-time Data
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

function BillingDashboardSkeleton() {
  return (
    <div className="mx-auto max-w-7xl space-y-12 px-4 py-8 md:px-8 md:py-12">
      <div className="grid gap-8 lg:grid-cols-[1fr_400px]">
        <div className="space-y-6">
          <Skeleton className="h-4 w-32 bg-white/5" />
          <div className="space-y-4">
            <Skeleton className="h-16 w-3/4 bg-white/5" />
            <Skeleton className="h-16 w-1/2 bg-white/5" />
          </div>
          <Skeleton className="h-12 w-48 rounded-[18px] bg-white/5" />
        </div>
        <Card className="border-white/10 bg-white/[0.03]">
          <CardHeader><Skeleton className="h-8 w-full bg-white/5" /></CardHeader>
          <CardContent className="space-y-8">
            <Skeleton className="h-12 w-1/2 bg-white/5" />
            <Skeleton className="h-24 w-full bg-white/5" />
          </CardContent>
        </Card>
      </div>
      <div className="grid gap-8 lg:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-[600px] w-full rounded-3xl bg-white/5" />
        ))}
      </div>
    </div>
  )
}

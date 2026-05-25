'use client'

import { Check } from 'lucide-react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { BILLING_PLAN_DEFINITIONS, BILLING_PLAN_ORDER } from '@/lib/billing-plans'
import { cn } from '@/lib/utils'
import Link from 'next/link'

const PLANS = BILLING_PLAN_ORDER.map((planId) => BILLING_PLAN_DEFINITIONS[planId])

export function PricingSection() {
  return (
    <div className="grid gap-8 lg:grid-cols-3">
      {PLANS.map((plan) => (
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
              <CardDescription className="text-[15px] text-white/40 leading-relaxed">
                Everything needed for professional output.
              </CardDescription>
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-5xl font-bold tracking-tighter text-white">{plan.priceWhole}</span>
              <div className="flex flex-col">
                <span className="text-xl font-bold text-white/40 leading-none">{plan.priceFraction}</span>
                <span className="text-[11px] font-black uppercase tracking-widest text-white/20">
                  {plan.monthlyLabel.replace('/', '').trim()}
                </span>
              </div>
            </div>
          </CardHeader>

          <CardContent className="flex-1 pb-10">
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
            <Button
              asChild
              className={cn(
                "h-12 w-full rounded-[18px] border border-white/10 text-[15px] font-semibold text-white transition-all",
                plan.featured 
                  ? "bg-blue-600 hover:bg-blue-700 shadow-[0_8px_20px_-6px_rgba(0,0,0,0.6)]" 
                  : "bg-white/5 hover:bg-white/10"
              )}
            >
              <Link href="/signup">Get Started</Link>
            </Button>
          </CardFooter>
        </Card>
      ))}
    </div>
  )
}

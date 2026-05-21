'use client'

import * as React from 'react'
import { ArrowUpRight } from 'lucide-react'
import { toast } from 'sonner'
import { initializePaddle, type Paddle } from '@paddle/paddle-js'

import type { BillingPlanId } from '@/lib/billing'
import { cn } from '@/lib/utils'

import { Button } from '@/components/ui/button'

type PaddleCheckoutButtonProps = {
  planId: BillingPlanId
  nextPath?: string | null
  ctaLabel: string
  className?: string
  paddleToken?: string
  paddleEnv?: 'sandbox' | 'production'
}

export function PaddleCheckoutButton({ 
  planId, 
  nextPath, 
  ctaLabel, 
  className,
  paddleToken = process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN,
  paddleEnv = (process.env.NEXT_PUBLIC_PADDLE_ENVIRONMENT as any) || 'sandbox'
}: PaddleCheckoutButtonProps) {
  const [isLoading, setIsLoading] = React.useState(false)
  const [paddle, setPaddle] = React.useState<Paddle>()

  React.useEffect(() => {
    if (paddleToken) {
      initializePaddle({ 
        environment: paddleEnv, 
        token: paddleToken,
        checkout: {
          settings: {
            displayMode: 'overlay',
            theme: 'dark',
            locale: 'en',
          }
        },
        eventCallback: (event) => {
          if (event.name === 'checkout.closed') {
            setIsLoading(false)
          }
        }
      }).then((paddleInstance) => {
        if (paddleInstance) {
          setPaddle(paddleInstance)
        }
      })
    }
  }, [paddleToken, paddleEnv])

  return (
    <Button
      size="lg"
      disabled={isLoading || !paddle}
      className={cn('h-12 w-full rounded-[14px] bg-[#1782ff] text-lg font-semibold text-white hover:bg-[#2a8cff]', className)}
      onClick={async () => {
        try {
          setIsLoading(true)

          const response = await fetch('/api/billing/checkout', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              planId,
              nextPath,
            }),
          })

          const data = (await response.json().catch(() => null)) as { error?: string; transactionId?: string; customerEmail?: string } | null

          if (!response.ok || !data?.transactionId) {
            throw new Error(data?.error ?? 'Unable to start Paddle checkout.')
          }

          if (!paddle) {
            throw new Error('Paddle is not initialized yet.')
          }

          paddle.Checkout.open({
            transactionId: data.transactionId,
            settings: {
              displayMode: 'overlay',
              successUrl: `${window.location.origin}/settings/billing/success?session_id=${data.transactionId}${nextPath ? `&next=${encodeURIComponent(nextPath)}` : ''}`,
            },
            customer: data.customerEmail ? { email: data.customerEmail } : undefined
          })
          
        } catch (error) {
          toast.error(error instanceof Error ? error.message : 'Unable to start Paddle checkout.')
          setIsLoading(false)
        }
      }}
    >
      {isLoading ? 'Opening checkout...' : ctaLabel}
      <ArrowUpRight className="size-4" />
    </Button>
  )
}

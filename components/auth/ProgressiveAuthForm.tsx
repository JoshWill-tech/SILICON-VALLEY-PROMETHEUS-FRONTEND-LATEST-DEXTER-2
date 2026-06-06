'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowRight, ChevronLeft, AtSign, Lock, User, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { SocialAuthButtons } from './SocialAuthButtons'
import { cn } from '@/lib/utils'

type AuthMode = 'login' | 'signup'
type Step = 'name' | 'email' | 'password' | 'welcome'

const SIGNUP_HEADLINES = [
  "Start your journey",
  "Create without limits", 
  "Your ideas, amplified",
  "The future of video editing",
  "Where imagination meets precision",
]

export function ProgressiveAuthForm({ initialMode = 'signup' }: { initialMode?: AuthMode }) {
  const [mode, setMode] = useState<AuthMode>(initialMode)
  const [step, setStep] = useState<Step>(mode === 'signup' ? 'name' : 'email')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [headline, setHeadline] = useState(SIGNUP_HEADLINES[0])
  const [domainMessage, setDomainMessage] = useState('')

  useEffect(() => {
    // Rotate headline once per session
    const savedHeadline = sessionStorage.getItem('prometheus:auth:headline')
    if (savedHeadline) {
      setHeadline(savedHeadline)
    } else {
      const random = SIGNUP_HEADLINES[Math.floor(Math.random() * SIGNUP_HEADLINES.length)]
      setHeadline(random)
      sessionStorage.setItem('prometheus:auth:headline', random)
    }
  }, [])

  const handleEmailBlur = () => {
    if (!email.includes('@')) return
    const domain = email.split('@')[1]
    if (domain.includes('gmail')) setDomainMessage('Back from the Googleverse?')
    else if (domain.includes('outlook') || domain.includes('hotmail')) setDomainMessage('Microsoft gang checks in.')
    else setDomainMessage('Fancy custom domain. I like it.')
  }

  const nextStep = () => {
    if (step === 'name') setStep('email')
    else if (step === 'email') setStep('password')
    else if (step === 'password') setStep('welcome')
  }

  const prevStep = () => {
    if (step === 'email' && mode === 'signup') setStep('name')
    else if (step === 'password') setStep('email')
  }

  const renderStep = () => {
    switch (step) {
      case 'name':
        return (
          <motion.div
            key="name"
            initial={{ x: 20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -20, opacity: 0 }}
            className="space-y-6"
          >
            <div className="space-y-2">
              <h2 className="text-3xl font-semibold tracking-tight">{headline}</h2>
              <p className="text-white/50">Join 10,000+ creators already on Prometheus</p>
            </div>
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 size-5 text-white/20" />
              <input
                autoFocus
                type="text"
                placeholder="Full Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && name.trim() && nextStep()}
                className="w-full h-14 bg-white/5 border border-white/10 rounded-full pl-12 pr-6 text-lg outline-none focus:border-accent-cyan/50 focus:bg-white/10 transition-all"
              />
            </div>
            <Button 
              onClick={nextStep}
              disabled={!name.trim()}
              className="w-full h-14 rounded-full bg-gradient-to-r from-accent-purple to-accent-blue text-lg font-medium group"
            >
              Continue <ArrowRight className="ml-2 size-5 group-hover:translate-x-1 transition-transform" />
            </Button>
          </motion.div>
        )

      case 'email':
        return (
          <motion.div
            key="email"
            initial={{ x: 20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -20, opacity: 0 }}
            className="space-y-6"
          >
            <div className="space-y-2">
              <h2 className="text-3xl font-semibold tracking-tight">
                {mode === 'signup' ? `Hey ${name.split(' ')[0]}.` : "Welcome back"}
              </h2>
              <p className="text-white/50">
                {mode === 'signup' ? "Where should we send your magic link?" : "Sign in to your account"}
              </p>
            </div>
            <div className="relative">
              <AtSign className="absolute left-4 top-1/2 -translate-y-1/2 size-5 text-white/20" />
              <input
                autoFocus
                type="email"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onBlur={handleEmailBlur}
                onKeyDown={(e) => e.key === 'Enter' && email.includes('@') && nextStep()}
                className="w-full h-14 bg-white/5 border border-white/10 rounded-full pl-12 pr-6 text-lg outline-none focus:border-accent-cyan/50 focus:bg-white/10 transition-all"
              />
              {domainMessage && (
                <motion.p 
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="absolute -bottom-6 left-6 text-xs text-accent-cyan/60"
                >
                  {domainMessage}
                </motion.p>
              )}
            </div>
            <Button 
              onClick={nextStep}
              disabled={!email.includes('@')}
              className="w-full h-14 rounded-full bg-gradient-to-r from-accent-purple to-accent-blue text-lg font-medium group"
            >
              Continue <ArrowRight className="ml-2 size-5 group-hover:translate-x-1 transition-transform" />
            </Button>
            
            {step === 'email' && (
              <>
                <div className="relative py-2">
                  <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-white/10" /></div>
                  <div className="relative flex justify-center text-xs uppercase"><span className="bg-transparent px-2 text-white/30">Or</span></div>
                </div>
                <SocialAuthButtons />
              </>
            )}
          </motion.div>
        )

      case 'password':
        return (
          <motion.div
            key="password"
            initial={{ x: 20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -20, opacity: 0 }}
            className="space-y-6"
          >
            <div className="space-y-2">
              <h2 className="text-3xl font-semibold tracking-tight">Lock it down.</h2>
              <p className="text-white/50">Choose a secure password (8+ chars)</p>
            </div>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 size-5 text-white/20" />
              <input
                autoFocus
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && password.length >= 8 && nextStep()}
                className="w-full h-14 bg-white/5 border border-white/10 rounded-full pl-12 pr-6 text-lg outline-none focus:border-accent-cyan/50 focus:bg-white/10 transition-all"
              />
            </div>
            <Button 
              onClick={nextStep}
              disabled={password.length < 8}
              className="w-full h-14 rounded-full bg-gradient-to-r from-accent-purple to-accent-blue text-lg font-medium"
            >
              {mode === 'signup' ? "Create Account" : "Sign In"}
            </Button>
          </motion.div>
        )

      case 'welcome':
        return (
          <motion.div
            key="welcome"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="flex flex-col items-center justify-center text-center space-y-6 py-8"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', damping: 12 }}
            >
              <CheckCircle2 className="size-20 text-accent-green" />
            </motion.div>
            <div className="space-y-2">
              <h2 className="text-3xl font-semibold tracking-tight">Welcome home, {name.split(' ')[0] || 'Creator'}</h2>
              <p className="text-white/50">Your creative journey begins now.</p>
            </div>
            <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
               <motion.div 
                 initial={{ width: 0 }}
                 animate={{ width: '100%' }}
                 transition={{ duration: 2 }}
                 className="h-full bg-accent-cyan"
                 onAnimationComplete={() => window.location.assign('/')}
               />
            </div>
          </motion.div>
        )
    }
  }

  return (
    <div className="relative">
      {step !== 'name' && step !== 'welcome' && (
        <button 
          onClick={prevStep}
          className="absolute -top-16 -left-4 p-2 text-white/30 hover:text-white transition-colors"
        >
          <ChevronLeft className="size-6" />
        </button>
      )}

      <AnimatePresence mode="wait">
        {renderStep()}
      </AnimatePresence>

      {step !== 'welcome' && (
        <div className="mt-12 flex justify-center gap-2">
          {['name', 'email', 'password'].map((s, i) => (
            <div 
              key={s}
              className={cn(
                "h-1.5 rounded-full transition-all duration-300",
                step === s ? "w-6 bg-accent-cyan" : "w-1.5 bg-white/10"
              )}
            />
          ))}
        </div>
      )}

      {step !== 'welcome' && (
        <p className="text-center mt-8 text-sm text-white/40">
          {mode === 'signup' ? (
            <>Already have an account? <button onClick={() => { setMode('login'); setStep('email'); }} className="text-accent-cyan hover:underline">Log in</button></>
          ) : (
            <>Don't have an account? <button onClick={() => { setMode('signup'); setStep('name'); }} className="text-accent-cyan hover:underline">Sign up</button></>
          )}
        </p>
      )}
    </div>
  )
}

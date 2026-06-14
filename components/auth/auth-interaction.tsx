'use client'

import * as React from 'react'

export type AuthActiveField = 'idle' | 'name' | 'email' | 'password' | 'confirm'

type PasswordSignal = {
  isSubmitting?: boolean
  passwordLength?: number
  showPassword?: boolean
}

type AuthInteractionContextValue = {
  activeField: AuthActiveField
  isSubmitting: boolean
  passwordLength: number
  showPassword: boolean
  setActiveField: (field: AuthActiveField) => void
  setPasswordSignal: (signal: PasswordSignal) => void
}

const AuthInteractionContext = React.createContext<AuthInteractionContextValue>({
  activeField: 'idle',
  isSubmitting: false,
  passwordLength: 0,
  showPassword: false,
  setActiveField: () => undefined,
  setPasswordSignal: () => undefined,
})

export function AuthInteractionProvider({ children }: { children: React.ReactNode }) {
  const [activeField, setActiveField] = React.useState<AuthActiveField>('idle')
  const [passwordLength, setPasswordLength] = React.useState(0)
  const [showPassword, setShowPassword] = React.useState(false)
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  const setPasswordSignal = React.useCallback((signal: PasswordSignal) => {
    if (signal.passwordLength !== undefined) setPasswordLength(signal.passwordLength)
    if (signal.showPassword !== undefined) setShowPassword(signal.showPassword)
    if (signal.isSubmitting !== undefined) setIsSubmitting(signal.isSubmitting)
  }, [])

  const value = React.useMemo<AuthInteractionContextValue>(
    () => ({
      activeField,
      isSubmitting,
      passwordLength,
      showPassword,
      setActiveField,
      setPasswordSignal,
    }),
    [activeField, isSubmitting, passwordLength, setPasswordSignal, showPassword],
  )

  return <AuthInteractionContext.Provider value={value}>{children}</AuthInteractionContext.Provider>
}

export function useAuthInteraction() {
  return React.useContext(AuthInteractionContext)
}

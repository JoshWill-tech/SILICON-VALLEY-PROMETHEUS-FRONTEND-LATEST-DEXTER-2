'use client';

import Link from 'next/link';
import React, { Suspense } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { ChevronLeftIcon } from 'lucide-react';
import { FloatingPaths, AuthSeparator } from './auth-visuals';
import { SocialAuthButtons } from './SocialAuthButtons';

type AuthShellProps = {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  showMobileBrandRow?: boolean;
};

export function AuthShell({ title, subtitle, children, showMobileBrandRow = true }: AuthShellProps) {
  React.useEffect(() => {
    const handleGlobalClick = (e: MouseEvent) => {
      console.log('DOM Click Target:', {
        tag: (e.target as HTMLElement).tagName,
        classes: (e.target as HTMLElement).className,
        id: (e.target as HTMLElement).id,
      });
    };
    window.addEventListener('mousedown', handleGlobalClick, true);
    return () => window.removeEventListener('mousedown', handleGlobalClick, true);
  }, []);

  return (
    <main className="relative md:h-screen lg:grid lg:grid-cols-2 bg-background">
      <div className="bg-muted/60 relative hidden h-full flex-col border-r p-10 lg:flex overflow-hidden">
        <div className="from-background pointer-events-none absolute inset-0 z-10 bg-gradient-to-t to-transparent" />
        <div className="z-10 flex items-center">
          <Image 
            src="/branding/prometheus-logo-no-bg.png" 
            alt="Prometheus" 
            width={28} 
            height={28} 
            className="size-7 object-contain"
          />
          <p className="text-xl font-bold tracking-tight ml-0.5" style={{ fontFamily: 'var(--font-mono), ui-sans-serif, system-ui, sans-serif' }}>
            rometheus
          </p>
        </div>

        <div className="z-10 mt-auto">
          <blockquote className="space-y-2">
            <p className="text-xl">
              &ldquo;This Platform has helped me to save time and serve my clients faster than ever before.&rdquo;
            </p>
            <footer className="font-mono text-sm font-semibold">~ Ali Hassan</footer>
          </blockquote>
        </div>

        <div className="absolute inset-0 pointer-events-none">
          <FloatingPaths position={1} />
          <FloatingPaths position={-1} />
        </div>
      </div>

      <div className="relative flex h-full flex-col justify-center p-4 md:p-8 pointer-events-auto z-[100] bg-background">
        <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 opacity-60">
          <div className="bg-[radial-gradient(68.54%_68.72%_at_55.02%_31.46%,--theme(--color-foreground/.06)_0,hsla(0,0%,55%,.02)_50%,--theme(--color-foreground/.01)_80%)] absolute top-0 right-0 h-320 w-140 -translate-y-87.5 rounded-full" />
          <div className="bg-[radial-gradient(50%_50%_at_50%_50%,--theme(--color-foreground/.04)_0,--theme(--color-foreground/.01)_80%,transparent_100%)] absolute top-0 right-0 h-320 w-60 [translate:5%_-50%] rounded-full" />
          <div className="bg-[radial-gradient(50%_50%_at_50%_50%,--theme(--color-foreground/.04)_0,--theme(--color-foreground/.01)_80%,transparent_100%)] absolute top-0 right-0 h-320 w-60 -translate-y-87.5 rounded-full" />
        </div>

        <Button 
          variant="ghost" 
          className="absolute top-7 left-5 pointer-events-auto z-[110]" 
          asChild
          title="Return home"
        >
          <Link href="/">
            <ChevronLeftIcon className="size-4 me-2" />
            Home
          </Link>
        </Button>

        <div className="mx-auto w-full max-w-sm space-y-4 pointer-events-auto z-[110]">
          {showMobileBrandRow ? (
            <div className="flex items-center lg:hidden">
              <Image 
                src="/branding/prometheus-logo-no-bg.png" 
                alt="Prometheus" 
                width={28} 
                height={28} 
                className="size-7 object-contain"
              />
              <p className="text-xl font-bold tracking-tight ml-0.5" style={{ fontFamily: 'var(--font-mono), ui-sans-serif, system-ui, sans-serif' }}>
                rometheus
              </p>
            </div>
          ) : null}

          <div className="flex flex-col space-y-1">
            <h1 className="font-heading text-2xl font-bold tracking-wide">{title}</h1>
            <p className="text-muted-foreground text-base">{subtitle}</p>
          </div>

          <Suspense fallback={null}>
            <SocialAuthButtons />
          </Suspense>

          <AuthSeparator />

          <Suspense fallback={null}>{children}</Suspense>

          <p className="text-muted-foreground mt-8 text-sm">
            By clicking continue, you agree to our{' '}
            <Link href="/terms" className="hover:text-primary underline underline-offset-4">
              Terms of Service
            </Link>{' '}
            and{' '}
            <Link href="/privacy" className="hover:text-primary underline underline-offset-4">
              Privacy Policy
            </Link>
            .
          </p>
        </div>
      </div>
    </main>
  );
}


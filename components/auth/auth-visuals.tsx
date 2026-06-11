'use client';

import * as React from 'react';
import { motion } from "motion/react";

export function FloatingPaths({ position }: { position: number }) {
	const paths = Array.from({ length: 36 }, (_, i) => ({
		id: i,
		d: `M-${380 - i * 5 * position} -${189 + i * 6}C-${
			380 - i * 5 * position
		} -${189 + i * 6} -${312 - i * 5 * position} ${216 - i * 6} ${
			152 - i * 5 * position
		} ${343 - i * 6}C${616 - i * 5 * position} ${470 - i * 6} ${
			684 - i * 5 * position
		} ${875 - i * 6} ${684 - i * 5 * position} ${875 - i * 6}`,
		color: `rgba(15,23,42,${0.1 + i * 0.03})`,
		width: 0.5 + i * 0.03,
	}));

	return (
		<div className="pointer-events-none absolute inset-0">
			<svg
				className="h-full w-full text-slate-950 dark:text-white"
				fill="none"
				viewBox="0 0 696 316"
			>
				<title>Background Paths</title>
				{paths.map((path) => (
					<motion.path
						animate={{
							pathLength: 1,
							opacity: [0.3, 0.6, 0.3],
							pathOffset: [0, 1, 0],
						}}
						d={path.d}
						initial={{ pathLength: 0.3, opacity: 0.6 }}
						key={path.id}
						stroke="currentColor"
						strokeOpacity={0.1 + path.id * 0.03}
						strokeWidth={path.width}
						transition={{
							duration: 20 + ((path.id * 13) % 10),
							repeat: Number.POSITIVE_INFINITY,
							ease: "linear",
						}}
					/>
				))}
			</svg>
		</div>
	);
}

export function AppleIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" {...props}>
      <path
        d="M17.05 20.28c-.96.95-2.14 2.05-3.6 2.05-1.5 0-1.95-.92-3.7-.92-1.76 0-2.32.92-3.72.92-1.45 0-2.83-1.35-3.78-2.73-1.94-2.82-1.94-7.25 0-10.08.97-1.4 2.43-2.28 3.96-2.28 1.5 0 2.52 1.03 3.44 1.03.88 0 2.13-1.15 3.76-1.15 1.53 0 2.92.83 3.73 1.9-3.23 1.9-2.7 6.13.55 7.42-.72 1.58-1.68 2.87-2.64 3.85zm-2.75-16.7c.78-.95 1.26-2.28 1.1-3.58-1.1.04-2.45.75-3.24 1.68-.7.83-1.3 2.18-1.1 3.45 1.24.1 2.47-.63 3.24-1.55z"
        fill="currentColor"
      />
    </svg>
  );
}

export function GoogleIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" {...props}>
      <path
        d="M21.35 11.1H12v2.9h5.35c-.24 1.3-1.5 3.8-5.35 3.8-3.22 0-5.86-2.66-5.86-5.9s2.64-5.9 5.86-5.9c1.84 0 3.07.79 3.78 1.47l2.58-2.48C16.87 3.6 14.7 2.5 12 2.5 6.98 2.5 2.9 6.6 2.9 11.9S6.98 21.3 12 21.3c6.93 0 8.62-4.87 8.62-7.39 0-.5-.05-.88-.12-1.21z"
        fill="currentColor"
      />
    </svg>
  );
}

export function AuthSeparator() {
  return (
    <div className="relative my-6">
      <div className="absolute inset-0 flex items-center pointer-events-none" aria-hidden="true">
        <span className="w-full border-t" />
      </div>
      <div className="relative flex justify-center text-xs uppercase">
        <span className="bg-background text-muted-foreground px-2">Or continue with email</span>
      </div>
    </div>
  );
}

"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  BarChart3,
  ChevronLeft,
  ChevronRight,
  Clock,
  Folder,
  Pin,
  Plus,
  Settings,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

import { useDeviceTier } from "@/hooks/useDeviceTier";

const navItems = [
  { id: "projects", label: "Projects", icon: Folder, count: 3, href: "/projects" },
  { id: "recent", label: "Recent", icon: Clock, count: 0, href: "/projects?view=recent" },
  { id: "motion", label: "Motion Brain", icon: Zap, count: 0, href: "/editor/motion" },
  { id: "analytics", label: "Analytics", icon: BarChart3, count: 0, href: "/analytics" },
];

export function AwwwardsSidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const [hovered, setHovered] = useState<string | null>(null);
  const pathname = usePathname();
  const shouldReduceMotion = useReducedMotion();
  const tier = useDeviceTier();
  const animated = !shouldReduceMotion && tier !== "low";
  const spring = animated ? { type: "spring" as const, damping: 30, stiffness: 300 } : { duration: 0 };

  return (
    <motion.aside
      initial={false}
      animate={{ width: collapsed ? 72 : 256 }}
      transition={spring}
      className="glass-panel relative flex h-full flex-col border-r border-border-subtle"
      aria-label="Premium editor navigation"
    >
      <button
        type="button"
        onClick={() => setCollapsed((value) => !value)}
        className="absolute -right-5 top-4 z-50 flex h-11 w-11 items-center justify-center rounded-full text-text-tertiary transition-colors hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-cyan"
        aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
      >
        <span className="flex h-6 w-6 items-center justify-center rounded-full border border-border-subtle bg-chrome-800 shadow-glass">
          {collapsed ? <ChevronRight className="h-3 w-3" /> : <ChevronLeft className="h-3 w-3" />}
        </span>
      </button>

      <div className="flex h-14 items-center border-b border-border-subtle px-4">
        <AnimatePresence mode="wait">
          {!collapsed ? (
            <motion.span
              key="full"
              initial={animated ? { opacity: 0 } : false}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-xs font-medium uppercase tracking-wider text-text-tertiary"
            >
              Workspace
            </motion.span>
          ) : (
            <motion.div
              key="icon"
              initial={animated ? { opacity: 0 } : false}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex w-full justify-center"
            >
              <Pin className="h-4 w-4 text-text-tertiary" />
            </motion.div>
          )}
        </AnimatePresence>

        {!collapsed && (
          <button
            type="button"
            className="glass-button ml-auto flex h-11 w-11 items-center justify-center rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-cyan md:h-6 md:w-6"
            aria-label="Create workspace item"
          >
            <Plus className="h-3.5 w-3.5 text-text-secondary" />
          </button>
        )}
      </div>

      <nav className="flex-1 overflow-y-auto overflow-x-visible p-2" aria-label="Editor sections">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = isNavItemActive(pathname, item.href);

          return (
            <Link
              key={item.id}
              href={item.href}
              onMouseEnter={() => setHovered(item.id)}
              onMouseLeave={() => setHovered(null)}
              className={`group relative flex min-h-11 w-full items-center rounded-xl border px-3 py-2.5 text-sm transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-cyan ${
                isActive
                  ? "border-accent-cyan/20 bg-accent-cyan-glow text-accent-cyan"
                  : "border-transparent text-text-secondary hover:bg-white/5 hover:text-text-primary"
              }`}
              aria-current={isActive ? "page" : undefined}
              aria-label={collapsed ? item.label : undefined}
            >
              <Icon className="h-[18px] w-[18px] flex-shrink-0" />
              <AnimatePresence>
                {!collapsed && (
                  <motion.span
                    initial={animated ? { opacity: 0, x: -8 } : false}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -8 }}
                    transition={{ duration: animated ? 0.15 : 0 }}
                    className="ml-3"
                  >
                    {item.label}
                  </motion.span>
                )}
              </AnimatePresence>

              {!collapsed && item.count > 0 && (
                <motion.span
                  initial={animated ? { scale: 0 } : false}
                  animate={{ scale: 1 }}
                  className="ml-auto rounded-full bg-surface-floating px-2 py-0.5 text-[10px] text-text-tertiary"
                >
                  {item.count}
                </motion.span>
              )}

              <AnimatePresence>
                {collapsed && hovered === item.id && (
                  <motion.div
                    initial={animated ? { opacity: 0, x: -4 } : false}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0 }}
                    className="glass-panel absolute left-full z-50 ml-2 whitespace-nowrap rounded-lg border border-border-subtle px-3 py-1.5 text-xs text-text-secondary"
                    style={{ backdropFilter: tier === "low" ? "none" : "blur(16px)" }}
                    role="tooltip"
                  >
                    {item.label}
                    {item.count > 0 && <span className="ml-2 text-text-tertiary">({item.count})</span>}
                  </motion.div>
                )}
              </AnimatePresence>
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-border-subtle p-4">
        {!collapsed ? (
          <div className="glass-button rounded-lg p-3">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-xs text-text-tertiary">Storage</span>
              <span className="text-xs text-text-secondary">60%</span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-floating">
              <motion.div
                initial={animated ? { width: 0 } : false}
                animate={{ width: "60%" }}
                transition={{ duration: animated ? 1 : 0, ease: "easeOut" }}
                className="h-full rounded-full bg-gradient-to-r from-accent-cyan to-accent-cyan-dim"
              />
            </div>
          </div>
        ) : (
          <div className="flex justify-center">
            <div className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-accent-cyan/30">
              <span className="text-[9px] font-bold text-accent-cyan">60</span>
            </div>
          </div>
        )}
      </div>

      <div className="border-t border-border-subtle p-2">
        <button
          type="button"
          className="flex min-h-11 w-full items-center rounded-xl px-3 py-2.5 text-sm text-text-secondary transition-colors hover:bg-white/5 hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-cyan"
          aria-label={collapsed ? "Settings" : undefined}
        >
          <Settings className="h-[18px] w-[18px]" />
          <AnimatePresence>
            {!collapsed && (
              <motion.span
                initial={animated ? { opacity: 0, x: -8 } : false}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -8 }}
                transition={{ duration: animated ? 0.15 : 0 }}
                className="ml-3"
              >
                Settings
              </motion.span>
            )}
          </AnimatePresence>
        </button>
      </div>
    </motion.aside>
  );
}

function isNavItemActive(pathname: string | null, href: string) {
  if (!pathname) return false;
  if (href.startsWith("/projects")) return pathname.startsWith("/projects");
  if (href === "/editor/motion") return pathname === "/editor/motion";
  if (href === "/analytics") return pathname.startsWith("/analytics");
  if (href.startsWith("/dashboard")) return pathname.startsWith("/dashboard");
  return pathname === href;
}

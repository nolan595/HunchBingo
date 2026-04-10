"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutGrid, Trophy, Calendar, Sliders, Home, Menu, X, Tag, Zap, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";
import { RefreshButton } from "./refresh-button";

const nav = [
  { href: "/",              label: "Dashboard",     icon: Home        },
  { href: "/games",         label: "Games",         icon: Trophy      },
  { href: "/weekend-setup", label: "Weekend Setup", icon: Zap         },
  { href: "/analytics",     label: "Analytics",     icon: TrendingUp  },
  { href: "/bingo-sheets",  label: "Bingo Sheets",  icon: LayoutGrid  },
  { href: "/events",        label: "Events",        icon: Calendar    },
  { href: "/segments",      label: "Segments",      icon: Tag         },
  { href: "/difficulties",  label: "Difficulties",  icon: Sliders     },
];

export function Sidebar({ openGamesCount = 0 }: { openGamesCount?: number }) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  // Close drawer on route change
  useEffect(() => { setMobileOpen(false); }, [pathname]);

  // Lock body scroll when drawer is open
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [mobileOpen]);

  const navContent = (
    <>
      {/* 3-px gradient accent line */}
      <div className="h-[3px] w-full shrink-0 bg-gradient-to-r from-indigo-500 via-violet-500 to-purple-500" />

      {/* Brand */}
      <div className="flex items-center gap-3 px-5 py-[18px] border-b border-slate-100">
        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shrink-0 shadow-sm shadow-indigo-500/30">
          <LayoutGrid className="h-3.5 w-3.5 text-white" />
        </div>
        <div className="min-w-0">
          <p className="font-bold text-[13px] text-slate-900 leading-none tracking-tight">Jack Connect 3</p>
          <p className="text-[10px] text-slate-400 mt-0.5 uppercase tracking-widest font-semibold">Admin</p>
        </div>
        {/* Close button — mobile only */}
        <button
          onClick={() => setMobileOpen(false)}
          className="ml-auto md:hidden p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          aria-label="Close menu"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-3 space-y-0.5 overflow-y-auto">
        {nav.map(({ href, label, icon: Icon }) => {
          const active = href === "/"
            ? pathname === "/"
            : pathname === href || pathname.startsWith(href + "/");
          const showLiveBadge = href === "/games" && openGamesCount > 0;
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "group relative flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-[13px] font-medium transition-all duration-150 select-none",
                active
                  ? "bg-indigo-50 text-indigo-700"
                  : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"
              )}
            >
              {/* Active left indicator */}
              <span
                className={cn(
                  "absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full transition-all duration-200",
                  active ? "bg-indigo-500 opacity-100" : "opacity-0"
                )}
              />
              <Icon
                className={cn(
                  "h-[15px] w-[15px] shrink-0 transition-colors duration-150",
                  active ? "text-indigo-600" : "text-slate-400 group-hover:text-slate-600"
                )}
              />
              <span className="flex-1">{label}</span>
              {showLiveBadge && (
                <span className="flex items-center gap-1">
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
                  </span>
                  <span className="text-[10px] font-bold text-emerald-600 tabular-nums">
                    {openGamesCount}
                  </span>
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer — pulsing live indicator + refresh */}
      <div className="px-5 py-4 border-t border-slate-100">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2 shrink-0">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
          </span>
          <span className="text-[11px] text-slate-400 font-semibold tracking-wide">Live · v0.1</span>
          <span className="ml-auto">
            <RefreshButton />
          </span>
        </div>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile top bar */}
      <header className="fixed top-0 left-0 right-0 h-14 bg-white border-b border-slate-200 shadow-sm z-30 flex items-center gap-3 px-4 md:hidden">
        <button
          onClick={() => setMobileOpen(true)}
          className="p-2 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5" />
        </button>
        <div className="flex items-center gap-2.5">
          <div className="w-6 h-6 rounded-md bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-sm shadow-indigo-500/30">
            <LayoutGrid className="h-3 w-3 text-white" />
          </div>
          <p className="font-bold text-[13px] text-slate-900 tracking-tight">Jack Connect 3</p>
        </div>
        {openGamesCount > 0 && (
          <span className="ml-auto flex items-center gap-1.5 bg-emerald-50 border border-emerald-200 rounded-full px-2.5 py-1">
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
            </span>
            <span className="text-[11px] font-bold text-emerald-700 tabular-nums">{openGamesCount} live</span>
          </span>
        )}
      </header>

      {/* Backdrop overlay — mobile only */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 md:hidden"
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "fixed left-0 top-0 h-full w-56 bg-white flex flex-col border-r border-slate-200/80 shadow-sm z-50 transition-transform duration-300 ease-in-out",
        // Desktop: always visible
        "md:translate-x-0 md:z-20",
        // Mobile: slide in/out
        mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
      )}>
        {navContent}
      </aside>
    </>
  );
}

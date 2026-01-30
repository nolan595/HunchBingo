"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Gamepad2, Target, Grid3x3, Calendar, Trophy, Menu, X } from "lucide-react";

type NavItem = {
  name: string;
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
};

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function isActivePath(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(href + "/");
}

export default function Sidebar({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);

  const navItems: NavItem[] = useMemo(
    () => [
      { name: "Games", label: "Games", href: "/games", icon: Trophy },
      { name: "BingoSheets", label: "Bingo Sheets", href: "/bingo-sheets", icon: Grid3x3 },
      { name: "OddsDifficulty", label: "Odds Difficulty", href: "/odds-difficulty", icon: Target },
      { name: "ExternalEvents", label: "External Events", href: "/external-events", icon: Calendar },
    ],
    []
  );

  const Sidebar = (
    <aside
      className={cx(
        "fixed left-0 top-0 h-full bg-slate-900/80 backdrop-blur-xl border-r border-purple-500/20 transition-all duration-300 z-50",
        sidebarOpen ? "w-64" : "w-20"
      )}
    >
      <div className="p-6 border-b border-purple-500/20">
        <div className="flex items-center justify-between">
          {sidebarOpen && (
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-600 to-cyan-500 flex items-center justify-center glow-primary">
                <Gamepad2 className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">Hunch</h1>
                <p className="text-xs text-purple-300">Vendor Dashboard</p>
              </div>
            </div>
          )}

          <button
            type="button"
            onClick={() => setSidebarOpen((v) => !v)}
            className="p-2 hover:bg-purple-500/20 rounded-lg transition-colors"
            aria-label={sidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
          >
            {sidebarOpen ? (
              <X className="w-5 h-5 text-purple-300" />
            ) : (
              <Menu className="w-5 h-5 text-purple-300" />
            )}
          </button>
        </div>
      </div>

      <nav className="p-4 space-y-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActivePath(pathname, item.href);

          return (
            <Link
              key={item.name}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={cx(
                "flex items-center gap-3 px-4 py-3 rounded-lg transition-all",
                active
                  ? "bg-gradient-to-r from-purple-600 to-cyan-600 text-white glow-primary"
                  : "text-slate-300 hover:bg-purple-500/10 hover:text-white"
              )}
            >
              <Icon className="w-5 h-5" />
              {sidebarOpen && <span className="font-medium">{item.label}</span>}
            </Link>
          );
        })}
      </nav>
    </aside>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* If you like this styling, move it into globals.css as CSS variables */}
      <style>{`
        :root {
          --primary: #8b5cf6;
          --secondary: #06b6d4;
          --accent: #ec4899;
        }
        .glow-primary { box-shadow: 0 0 20px rgba(139, 92, 246, 0.3); }
        .glow-secondary { box-shadow: 0 0 20px rgba(6, 182, 212, 0.3); }
      `}</style>

      {/* Mobile top bar (optional but handy) */}
      <div className="lg:hidden sticky top-0 z-40 border-b border-purple-500/20 bg-slate-950/70 backdrop-blur-xl">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-purple-600 to-cyan-500 flex items-center justify-center glow-primary">
              <Gamepad2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="text-white font-semibold leading-tight">Bingo Game</div>
              <div className="text-xs text-purple-300">Vendor Dashboard</div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            className="p-2 hover:bg-purple-500/20 rounded-lg transition-colors"
            aria-label="Open menu"
          >
            <Menu className="w-5 h-5 text-purple-300" />
          </button>
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:block">{Sidebar}</div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50">
          <div
            className="absolute inset-0 bg-black/60"
            onClick={() => setMobileOpen(false)}
            aria-hidden="true"
          />
          <div className="absolute left-0 top-0 h-full w-72">
            {/* Force open in mobile */}
            <div className="h-full">{Sidebar}</div>
          </div>
        </div>
      )}

      {/* Main content */}
      <main
        className={cx(
          "transition-all duration-300",
          // Desktop spacing based on sidebar width
          "lg:ml-64",
          !sidebarOpen && "lg:ml-20"
        )}
      >
        <div className="p-6">{children}</div>
      </main>
    </div>
  );
}

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutGrid, Trophy, Calendar, Sliders } from "lucide-react";
import { cn } from "@/lib/utils";

const nav = [
  { href: "/games", label: "Games", icon: Trophy },
  { href: "/bingo-sheets", label: "Bingo Sheets", icon: LayoutGrid },
  { href: "/events", label: "Events", icon: Calendar },
  { href: "/difficulties", label: "Difficulties", icon: Sliders },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 h-full w-56 bg-[#050810] text-white flex flex-col border-r border-white/[0.06]">
      {/* Brand */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-white/[0.06]">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center shrink-0 shadow-[0_0_16px_rgba(59,130,246,0.5)]">
          <LayoutGrid className="h-4 w-4 text-white" />
        </div>
        <div className="leading-tight">
          <p className="font-semibold text-sm text-white tracking-tight">Hunch Bingo</p>
          <p className="text-[10px] text-white/25 font-medium tracking-widest uppercase mt-0.5">Admin</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2 py-4 space-y-0.5">
        {nav.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 border-l-2",
                active
                  ? "bg-blue-500/[0.1] text-blue-300 border-blue-500/60"
                  : "text-white/35 hover:bg-white/[0.04] hover:text-white/60 border-transparent"
              )}
            >
              <Icon
                className={cn(
                  "h-[15px] w-[15px] shrink-0",
                  active ? "text-blue-400" : "text-white/25"
                )}
              />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-4 pb-5 pt-3 border-t border-white/[0.06]">
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.7)]" />
          <p className="text-[10px] text-white/20 font-medium tracking-wide">v0.1 · Live</p>
        </div>
      </div>
    </aside>
  );
}

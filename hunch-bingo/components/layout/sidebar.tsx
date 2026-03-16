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
    <aside className="fixed left-0 top-0 h-full w-56 bg-zinc-950 text-white flex flex-col border-r border-zinc-800">
      {/* Brand */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-zinc-800/60">
        <div className="w-8 h-8 rounded-lg bg-green-500 flex items-center justify-center shrink-0">
          <LayoutGrid className="h-4 w-4 text-white" />
        </div>
        <div className="leading-tight">
          <p className="font-semibold text-sm text-white">Connect 3</p>
          <p className="text-[10px] text-zinc-500 font-medium tracking-wide uppercase">Admin</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2 py-3 space-y-0.5">
        {nav.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all",
                active
                  ? "bg-zinc-800 text-white"
                  : "text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200"
              )}
            >
              <Icon className={cn("h-4 w-4 shrink-0", active ? "text-green-400" : "")} />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-4 pb-4 pt-3 border-t border-zinc-800/60">
        <p className="text-[10px] text-zinc-600 font-medium">Hunch Bingo · v0.1</p>
      </div>
    </aside>
  );
}

"use client";

import { useTransition } from "react";
import { RefreshCw } from "lucide-react";
import { revalidateAll } from "@/app/actions";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

export function RefreshButton() {
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function handleClick() {
    startTransition(async () => {
      await revalidateAll();
      router.refresh();
    });
  }

  return (
    <button
      onClick={handleClick}
      disabled={pending}
      title="Refresh all data"
      className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors disabled:opacity-40"
    >
      <RefreshCw className={cn("h-3.5 w-3.5", pending && "animate-spin")} />
    </button>
  );
}

import { fetchTopTenEvents, type TopTenEvent } from "@/lib/offer-api";
import { WeekendSetup } from "./WeekendSetup";

export const dynamic = "force-dynamic";

export default async function WeekendSetupPage() {
  let events: TopTenEvent[] = [];
  let error: string | null = null;

  try {
    events = await fetchTopTenEvents();
  } catch (e) {
    error = e instanceof Error ? e.message : "Failed to load fixtures";
  }

  return (
    <div className="space-y-6 animate-enter">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Weekend Setup</h1>
        <p className="text-sm text-slate-500 mt-1">
          Select top fixtures to batch-create games. Prices lock immediately on creation.
        </p>
      </div>

      {error && (
        <div className="⚠ text-red-700 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm">
          ⚠ {error}
        </div>
      )}

      <WeekendSetup initialEvents={events} />
    </div>
  );
}

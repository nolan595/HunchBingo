"use client";

import React, { useMemo, useState } from "react";
import type { OddsDifficulty, OddsDifficultyFormState } from "@/lib/types/oddsDifficulty";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

function toFormState(d: OddsDifficulty): OddsDifficultyFormState {
  return { name: d.name, min_odds: String(d.min_odds), max_odds: String(d.max_odds) };
}

export function DifficultyFormDialog({
  open,
  onOpenChange,
  editing,
  onCreate,
  onUpdate,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editing: OddsDifficulty | null;
  onCreate: (data: { name: string; min_odds: number; max_odds: number }) => void | Promise<void>;
  onUpdate: (id: number, data: { name: string; min_odds: number; max_odds: number }) => void | Promise<void>;
}) {
  const [form, setForm] = useState<OddsDifficultyFormState>({
    name: "",
    min_odds: "",
    max_odds: "",
  });

  // When dialog opens, sync form from editing (or reset)
  React.useEffect(() => {
    if (!open) return;
    if (editing) setForm(toFormState(editing));
    else setForm({ name: "", min_odds: "", max_odds: "" });
  }, [open, editing]);

  const title = useMemo(
    () => (editing ? "Edit Difficulty" : "Create New Difficulty"),
    [editing]
  );

  function submit(e: React.FormEvent) {
    e.preventDefault();

    const name = form.name.trim();
    const min = Number(form.min_odds);
    const max = Number(form.max_odds);

    if (!name) return;
    if (!Number.isFinite(min) || !Number.isFinite(max)) return;
    if (min >= max) {
      console.warn("Validation: min_odds must be < max_odds");
      return;
    }

    const payload = { name, min_odds: min, max_odds: max };

    if (editing) onUpdate(editing.id, payload);
    else onCreate(payload);

    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange} title={title}>
      <form onSubmit={submit} className="space-y-4">
        <div>
          <Label>Name</Label>
          <Input
            value={form.name}
            onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
            placeholder="e.g., Near Certain, Easy, Medium"
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Min Odds</Label>
            <Input
              type="number"
              step="0.01"
              value={form.min_odds}
              onChange={(e) => setForm((p) => ({ ...p, min_odds: e.target.value }))}
              placeholder="1.2"
              required
            />
          </div>
          <div>
            <Label>Max Odds</Label>
            <Input
              type="number"
              step="0.01"
              value={form.max_odds}
              onChange={(e) => setForm((p) => ({ ...p, max_odds: e.target.value }))}
              placeholder="1.5"
              required
            />
          </div>
        </div>

        <Button
          type="submit"
          className="w-full h-12 bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-700 hover:to-cyan-700 text-base font-semibold"
        >
          {editing ? "Update" : "Create"}
        </Button>
      </form>
    </Dialog>
  );
}

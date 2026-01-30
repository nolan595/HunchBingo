"use client";

import React, { useState } from "react";
import { Plus } from "lucide-react";
import type { OddsDifficulty } from "@/lib/types/oddsDifficulty";
import { Button } from "@/components/ui/button";
import { DifficultyCard } from "@/components/odds-difficulty/DifficultyCard";
import { DifficultyFormDialog } from "@/components/odds-difficulty/DifficultyFormDialog";
import { useOddsDifficulties } from "@/components/odds-difficulty/useOddsDifficulties";

export default function OddsDifficultyScreen() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<OddsDifficulty | null>(null);
  const { items, create, update, remove } = useOddsDifficulties();

  function openCreate() {
    setEditing(null);
    setDialogOpen(true);
  }

  function openEdit(d: OddsDifficulty) {
    setEditing(d);
    setDialogOpen(true);
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-white mb-2">Odds Difficulty</h1>
          <p className="text-purple-300">Manage odds ranges for your bingo tiles</p>
        </div>

        <Button
          onClick={openCreate}
          className="bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-700 hover:to-cyan-700"
        >
          <Plus className="w-5 h-5 mr-2" />
          Add Difficulty
        </Button>
      </div>

      <DifficultyFormDialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) setEditing(null);
        }}
        editing={editing}
        onCreate={(data) => create(data)}
        onUpdate={(id, data) => update(id, data)}
      />

      {/* Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {items.map((d) => (
          <DifficultyCard
            key={d.id}
            difficulty={d}
            onEdit={openEdit}
            onDelete={remove}
          />
        ))}
      </div>
    </div>
  );
}

"use client";

import { Edit2, Target, Trash2 } from "lucide-react";
import type { OddsDifficulty } from "@/lib/types/oddsDifficulty";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function DifficultyCard({
  difficulty,
  onEdit,
  onDelete,
}: {
  difficulty: OddsDifficulty;
  onEdit: (d: OddsDifficulty) => void;
  onDelete: (id: number) => void;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between text-white">
          <div className="flex items-center gap-2">
            <Target className="w-5 h-5 text-cyan-400" />
            {difficulty.name}
          </div>

          <div className="flex gap-2">
            <Button
              size="icon"
              variant="ghost"
              onClick={() => onEdit(difficulty)}
              className="hover:bg-purple-500/20 text-purple-300"
              aria-label={`Edit ${difficulty.name}`}
              type="button"
            >
              <Edit2 className="w-4 h-4" />
            </Button>

            <Button
              size="icon"
              variant="ghost"
              onClick={() => onDelete(difficulty.id)}
              className="hover:bg-red-500/20 text-red-400"
              aria-label={`Delete ${difficulty.name}`}
              type="button"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </CardTitle>
      </CardHeader>

      <CardContent>
        <div className="flex items-center justify-center py-4">
          <div className="text-center">
            <p className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
              {difficulty.min_odds} - {difficulty.max_odds}
            </p>
            <p className="text-sm text-purple-300 mt-2">Odds Range</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

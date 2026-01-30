"use client";

import { useEffect, useState } from "react";
import type { OddsDifficulty } from "@/lib/types/oddsDifficulty";
import {
  createOddsDifficulty,
  deleteOddsDifficulty,
  listOddsDifficulties,
  updateOddsDifficulty,
} from "@/app/odds-difficulty/actions";

function toUi(item: { id: number; name: string; minOdd: number; maxOdd: number }): OddsDifficulty {
  return {
    id: item.id,
    name: item.name,
    min_odds: item.minOdd,
    max_odds: item.maxOdd,
  };
}

export function useOddsDifficulties() {
  const [items, setItems] = useState<OddsDifficulty[]>([]);

  useEffect(() => {
    let active = true;
    listOddsDifficulties()
      .then((rows) => {
        if (!active) return;
        setItems(rows.map(toUi));
      })
      .catch((error) => {
        console.error("Failed to load odds difficulties", error);
      });
    return () => {
      active = false;
    };
  }, []);

  async function create(data: Omit<OddsDifficulty, "id">) {
    const created = await createOddsDifficulty({
      name: data.name,
      minOdd: data.min_odds,
      maxOdd: data.max_odds,
    });
    setItems((prev) => [toUi(created), ...prev]);
  }

  async function update(id: number, data: Omit<OddsDifficulty, "id">) {
    const updated = await updateOddsDifficulty(id, {
      name: data.name,
      minOdd: data.min_odds,
      maxOdd: data.max_odds,
    });
    setItems((prev) => prev.map((d) => (d.id === id ? toUi(updated) : d)));
  }

  async function remove(id: number) {
    await deleteOddsDifficulty(id);
    setItems((prev) => prev.filter((d) => d.id !== id));
  }

  return { items, create, update, remove };
}

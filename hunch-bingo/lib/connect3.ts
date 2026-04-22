import type { SquareStatus } from "@/app/generated/prisma";

// Positions 1-9 map to indices 0-8
// Grid layout:
// 1 2 3
// 4 5 6
// 7 8 9

export const LINES = [
  [0, 1, 2], // row 1
  [3, 4, 5], // row 2
  [6, 7, 8], // row 3
  [0, 3, 6], // col 1
  [1, 4, 7], // col 2
  [2, 5, 8], // col 3
  [0, 4, 8], // diagonal top-left → bottom-right
  [2, 4, 6], // diagonal top-right → bottom-left
];

export const TOTAL_LINES = LINES.length;

export function evaluateConnect3(statuses: SquareStatus[]): {
  connect3: boolean;
  score: number;
} {
  // score = number of completed lines (not won squares)
  const score = LINES.filter((line) =>
    line.every((i) => statuses[i] === "WON")
  ).length;
  const connect3 = score > 0;
  return { connect3, score };
}

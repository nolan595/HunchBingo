import type { SquareStatus } from "@/app/generated/prisma";

// Positions 1-9 map to indices 0-8
// Grid layout:
// 1 2 3
// 4 5 6
// 7 8 9

const LINES = [
  [0, 1, 2], // row 1
  [3, 4, 5], // row 2
  [6, 7, 8], // row 3
  [0, 3, 6], // col 1
  [1, 4, 7], // col 2
  [2, 5, 8], // col 3
];

export function evaluateConnect3(statuses: SquareStatus[]): {
  connect3: boolean;
  score: number;
} {
  const score = statuses.filter((s) => s === "WON").length;
  const connect3 = LINES.some((line) =>
    line.every((i) => statuses[i] === "WON")
  );
  return { connect3, score };
}

export type OddsDifficulty = {
  id: number;
  name: string;
  min_odds: number;
  max_odds: number;
};

export type OddsDifficultyFormState = {
  name: string;
  min_odds: string;
  max_odds: string;
};

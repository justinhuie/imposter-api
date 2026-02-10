import type { CategoryId, WordEntry } from "../data/categories";

export type Game = {
  id: string;

  categoryIds: CategoryId[];

  numPlayers: number;
  numImposters: number;
  hintsEnabled: boolean;

  chosen: WordEntry;
  imposters: Set<number>; 
  revealed: Set<number>;

  createdAt: number;
};

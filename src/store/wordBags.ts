import type { WordEntry } from "../data/categories";

type Pool = {
  words: WordEntry[];
  bag: number[]; 
};

const pools = new Map<string, Pool>();

function shuffle<T>(arr: T[]): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function refillBag(n: number) {
  return shuffle(Array.from({ length: n }, (_, i) => i));
}

export function registerCategoryWords(categoryId: string, words: WordEntry[]) {
  const existing = pools.get(categoryId);

  if (!existing || existing.words.length !== words.length) {
    pools.set(categoryId, { words, bag: refillBag(words.length) });
    return;
  }

  existing.words = words;
}

export function drawWord(categoryId: string): WordEntry {
  const pool = pools.get(categoryId);
  if (!pool) throw new Error(`No pool for categoryId ${categoryId}`);

  if (pool.words.length === 0) throw new Error(`Category ${categoryId} has no words`);

  if (pool.bag.length === 0) {
    pool.bag = refillBag(pool.words.length);
  }

  const idx = pool.bag.pop()!;
  return pool.words[idx];
}

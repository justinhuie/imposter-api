import express from "express";
import { randomUUID } from "crypto";
import cors from "cors";

import { categories, getCategory } from "./data/categories";
import { games } from "./store/games";
import type { Game } from "./models/settings";
import type { CategoryId } from "./data/categories";
import { registerCategoryWords, drawWord } from "./store/wordBags";

const app = express();

const PORT = Number(process.env.PORT ?? 8080);

const GAME_TTL_MS = 45 * 60 * 1000; 
const CLEANUP_EVERY_MS = 5 * 60 * 1000; 


app.use(
  cors({
    origin: [
      "http://localhost:8081",
      "http://localhost:19006",
    ],
  })
);

app.use(express.json()); 

if (process.env.NODE_ENV !== "production") {
  app.use((req, _res, next) => {
    console.log(`${req.method} ${req.path}`);
    next();
  });
}

function pickUniqueNumbers(count: number, maxInclusive: number): Set<number> {
  const chosen = new Set<number>();
  while (chosen.size < count) {
    const n = Math.floor(Math.random() * maxInclusive) + 1; 
    chosen.add(n);
  }
  return chosen;
}

function cleanupExpiredGames() {
  const now = Date.now();

  for (const [id, game] of games.entries()) {
    if (now - game.createdAt > GAME_TTL_MS) {
      games.delete(id);
    }
  }
}


app.get("/health", (_req, res) => res.json({ ok: true }));

app.get("/categories", (_req, res) => {
  res.json(categories.map(({ id, name }) => ({ id, name })));
});

app.post("/games", (req, res) => {
  const { categoryIds, categoryId, numPlayers, numImposters, hintsEnabled, customCategories } =
    req.body as {
      categoryIds?: string[];
      categoryId?: string;
      numPlayers: number;
      numImposters: number;
      hintsEnabled: boolean;
      customCategories?: Array<{
        id: string;
        name: string;
        words: Array<{ word: string; hint?: string }>;
      }>;
    };

  const ids =
    Array.isArray(categoryIds) && categoryIds.length > 0
      ? categoryIds
      : categoryId
        ? [categoryId]
        : [];

  if (!ids.length) {
    return res.status(400).json({ error: "categoryIds (or categoryId) is required" });
  }

  if (!Number.isInteger(numPlayers) || numPlayers < 3 || numPlayers > 20) {
    return res.status(400).json({ error: "numPlayers must be an integer between 3 and 20" });
  }
  if (!Number.isInteger(numImposters) || numImposters < 1 || numImposters >= numPlayers) {
    return res.status(400).json({ error: "numImposters must be >= 1 and < numPlayers" });
  }
  if (typeof hintsEnabled !== "boolean") {
    return res.status(400).json({ error: "hintsEnabled must be boolean" });
  }

  if (ids.length > 10) {
    return res.status(400).json({ error: "Too many categories selected" });
  }

  if (customCategories && customCategories.length > 50) {
    return res.status(400).json({ error: "Too many custom categories" });
  }

  const customById = new Map((customCategories ?? []).map((c) => [c.id, c]));
  const selectedCategories = ids.map((id) => customById.get(id) ?? getCategory(id as any));
  if (selectedCategories.some((c) => !c)) {
    return res.status(404).json({ error: "One or more categoryIds are unknown" });
  }

  const combinedWords = selectedCategories.flatMap((c) => c!.words);
  if (!combinedWords.length) {
    return res.status(500).json({ error: "Selected categories have no words configured" });
  }

  if (combinedWords.length > 5000) {
    return res.status(413).json({ error: "Too many words in selected categories" });
  }

  for (const w of combinedWords) {
    if (w.word.length > 64) return res.status(400).json({ error: "Word too long" });
    if (w.hint && w.hint.length > 140) return res.status(400).json({ error: "Hint too long" });
  }

  const imposters = pickUniqueNumbers(numImposters, numPlayers);

  selectedCategories.forEach((cat, i) => {
    const id = ids[i];
    registerCategoryWords(String(id), cat!.words);
  });

  const chosenCategoryId = ids[Math.floor(Math.random() * ids.length)];
  const chosen = drawWord(String(chosenCategoryId));

  const gameId = randomUUID();
  const game: Game = {
    id: gameId,
    categoryIds: ids as CategoryId[],
    numPlayers,
    numImposters,
    hintsEnabled,
    chosen,
    imposters,
    revealed: new Set<number>(),
    createdAt: Date.now(),
  };

  games.set(gameId, game);
  res.json({ gameId, numPlayers });
});

app.post("/games/:gameId/reveal", (req, res) => {
  const { gameId } = req.params;
  const { playerNumber } = req.body as { playerNumber: number };

  const game = games.get(gameId);
  if (!game) return res.status(404).json({ error: "Game not found" });

  if (!Number.isInteger(playerNumber) || playerNumber < 1 || playerNumber > game.numPlayers) {
    return res.status(400).json({ error: `playerNumber must be 1..${game.numPlayers}` });
  }

  if (game.revealed.has(playerNumber)) {
    return res.status(409).json({ error: "This player has already revealed" });
  }

  game.revealed.add(playerNumber);

  const isImposter = game.imposters.has(playerNumber);
  const hint = game.hintsEnabled ? (game.chosen.hint ?? null) : null;

  if (isImposter) {
    return res.json({ role: "imposter", hint });
  }

  return res.json({ role: "player", word: game.chosen.word });
});

// Solution
app.get("/games/:gameId/solution", (req, res) => {
  const game = games.get(req.params.gameId);
  if (!game) return res.status(404).json({ error: "Game not found" });

  res.json({
    word: game.chosen.word,
    imposters: Array.from(game.imposters).sort((a, b) => a - b),
  });
});

app.use((_req, res) => {
  res.status(404).json({ error: "Not found" });
});

app.use((err: any, _req: any, res: any, _next: any) => {
  console.error("Unhandled error:", err);

  res.status(500).json({
    error: "Internal server error",
  });
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on http://0.0.0.0:${PORT}`);

  cleanupExpiredGames();
  setInterval(cleanupExpiredGames, CLEANUP_EVERY_MS);
});

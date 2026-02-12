# Imposter Multiplayer Game API

A backend API powering a party game.

This API handles game creation, role assignment, reveals, game expiration, and category-based word selection.

---

## Features

- Create multiplayer games with configurable players and imposters  
- Secure role reveals per player  
- Category-based word selection with optional custom categories  
- Automatic game expiration with periodic cleanup  
- Restart game with identical settings  
- In-memory state optimized for short-lived sessions  
- Mobile-friendly REST API for Expo / React Native clients  

---

## Tech Stack

- **Runtime:** Node.js  
- **Framework:** Express (TypeScript)  
- **Deployment:** Fly.io  
- **State Storage:** In-memory (Map-based)  
- **Networking:** RESTful JSON API  
- **CORS:** Configured for mobile + optional web support  

---

## Architecture Highlights

- HTTP API with ephemeral in-memory game state
- Deterministic role assignment using secure UUIDs
- One-time reveal per player
- Category word bags registered per game
- Periodic TTL-based cleanup to prevent memory leaks
- Explicit validation for all incoming requests
- Health check endpoint for deployment verification

---

## 📡 API Endpoints

### Health
```
GET /health
→ { ok: true }
```

### List Categories
```
GET /categories
```

### Create Game
```
POST /games
```

Request body:
```json
{
  "categoryIds": ["movies", "animals"],
  "numPlayers": 6,
  "numImposters": 2,
  "hintsEnabled": true
}
```

### Reveal Role (one-time per player)
```
POST /games/:gameId/reveal
```

```json
{
  "playerNumber": 3
}
```

### Reveal Solution
```
GET /games/:gameId/solution
```

---

## Running Locally

```bash
npm install
npm run dev
```

Server runs on:
```
http://localhost:8080
```

---

## Project Structure

```
src/
├─ data/
│  └─ categories.ts        # Built-in game categories and word lists
│
├─ models/
│  └─ settings.ts          # Game and settings types
│
├─ store/
│  ├─ games.ts             # In-memory game store
│  └─ wordBags.ts          # Word bag registration & randomization
│
├─ index.ts                # Express app entry point
```

---

## Deployment

The API is deployed using **Fly.io**.

- Production build uses `npm run build`
- Runtime executes `node dist/index.js`
- Includes `/health` endpoint for deployment verification
- Automatic cleanup runs every 5 minutes
- Games expire after 45 minutes

---

## Notes

- This API intentionally stores **no persistent data**

---

## Future Improvements

- [ ] WebSocket support for real-time game sync
- [ ] Persistent storage (Redis) for horizontal scaling
- [ ] Rate limiting per IP
- [ ] Admin / debug endpoints for moderation
- [ ] Game analytics and telemetry

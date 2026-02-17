# Imposter Multiplayer Game API

This API exists because the mobile app needed a simple way to coordinate games without relying on local state alone. It handles game setup, role assignment, and reveals, but intentionally stays lightweight since most games are short-lived and played in person.

There’s no database — everything lives in memory and resets when the server restarts.

---

## Features

- Creating a game with players, imposters, and a category
- Assigns roles and reveals them one at a time
- Choosing a word from a category
- Expiring games automatically so memory does not pile up

---

## Tech Stack

- **Runtime:** Node.js  
- **Framework:** Express (TypeScript)  
- **Deployment:** Fly.io  
- **State Storage:** In-memory (Map-based)  
- **Networking:** RESTful JSON API  
- **CORS:** Configured for mobile + optional web support  

---

## Implementation Notes

- Games are stored in memory and keyed by an ID returned at creation time
- Each reveal request is validated against current game state so players can't reveal twice
- Because app is usually offline after setup, the API does not try to maintain long-lived sessions
---

## API Endpoints

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
  index.ts

  store/
    games.ts
    wordBags.ts

  data/
    categories.ts

  models/
    settings.ts

```

---

## Deployment

The API is deployed using **Fly.io**.

- Built with npm run build
- Runs using `node dist/index.js`
- Includes `/health` endpoint for basic monitoring

---

## Future Improvements

- WebSocket support for real-time game sync
- Persistent storage (Redis) for scaling
- Rate limiting 
- Admin / debug endpoints
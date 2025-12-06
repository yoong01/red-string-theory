# Red String Theory

## Concept
Autonomous clothing swaps powered by AI agents, with on-chain swap intents and voice narrations.

## Structure

- `contracts/` — Smart contract source and compiled NEF for Neo.
- `src/` — Backend code:
  - `agents/` — Clothing agent logic (compatibility + negotiation)
  - `blockchain/` — Neo smart contract wrappers
  - `voice/` — LLM dialogue and ElevenLabs TTS
  - `api/` — HTTP endpoints for the UI
  - `data/` — Seed clothes
  - `utils/` — Helper functions
  - `config/` — Weights, settings, environment examples
- `ui/` — Simple frontend to view clothes, swaps, and hear dialogues
- `scripts/` — Deployment and seed data scripts

## How to Run
1. `npm install`  
2. `node src/index.js` — starts agents + API  
3. Open `ui/index.html` in browser to see swaps
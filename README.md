# Red String Theory - Autonomous Garment Swap Platform

An AI-powered platform where autonomous agents negotiate clothing trades on behalf of garments, using compatibility scoring and natural language dialogues.

**Powered by [SpoonOS Framework](https://github.com/XSpoonAi/spoon-core)** - AI agent orchestration and LLM integration

## Architecture

### Backend Components

- **SpoonOS Framework**: Core AI agent system with ToolCallAgent and custom tools
- **Supabase Database**: Stores garments, users, swap intents, and swap history
- **GarmentAgent**: Autonomous agents that evaluate compatibility and propose swaps
- **Agent Orchestrator**: Continuously runs matching logic every 60 seconds
- **LLM Dialogue Generation**: Creates natural conversations using SpoonOS ChatBot
- **ElevenLabs Voice Synthesis**: Converts dialogues to audio (optional)
- **Neo N3 Blockchain**: Records swap intents on-chain (optional)

### Frontend

- **My Closet**: View and manage your garments
- **Active Matches**: See ongoing negotiations with compatibility scores and agent conversations
- **History**: Review completed swaps

## Quick Start

### 1. Environment Setup

The `.env` file contains your Supabase credentials. The database is already configured and ready to use.

**Required:** Add an LLM API key for SpoonOS (choose at least one):
```env
OPENAI_API_KEY=sk-...
# or
ANTHROPIC_API_KEY=sk-ant-...
# or
GEMINI_API_KEY=AIza...
```

Optional environment variables:
- `ELEVENLABS_API_KEY`: For voice synthesis (optional)
- `NEO_PRIVATE_KEY`: For blockchain integration (optional)

### 2. Install Dependencies

**Node.js dependencies:**
```bash
npm install
```

**Python dependencies (SpoonOS):**
```bash
pip install -r requirements.txt
```

### 3. Database Setup

The database schema is already created. To populate with demo data:

```bash
npm run seed
```

This creates:
- 2 demo users (Alice and Bob)
- 8 sample garments with different styles and personalities

### 4. Start the Services

**Terminal 1 - SpoonOS Service (Python):**
```bash
cd spoon_service
python server.py
```

**Terminal 2 - Node.js API Server:**
```bash
npm start
```

The SpoonOS service starts on port 5000, and the Node.js API server starts on port 3001. The agent orchestrator will begin autonomously matching garments.

### 5. Serve the Frontend

Open `ui/index.html` in a web browser, or use a simple HTTP server:

```bash
# Using Python
python3 -m http.server 8000 --directory ui

# Using Node.js http-server (if installed)
npx http-server ui -p 8000
```

Then open `http://localhost:8000` in your browser.

## How It Works

### 1. User Uploads Garments

Users provide:
- Visual documentation (image URL)
- Style tags (vintage, streetwear, cottagecore, etc.)
- Personality traits (bold, refined, chaotic, understated)
- Practical specs (category, size, condition)
- Match standards (minimum compatibility threshold)
- Patience level (how quickly standards degrade)

### 2. Autonomous Agent Behavior

Each garment has an autonomous agent that:
- Continuously evaluates compatibility with all available garments
- Proposes swaps when compatibility exceeds the garment's standards
- Responds to incoming proposals based on compatibility scoring
- Gradually lowers standards over time if unmatched (based on patience)

### 3. Compatibility Scoring

Agents calculate compatibility using weighted factors:
- **Style overlap** (30%): Shared style tags
- **Vibe alignment** (15%): Matching aesthetic
- **Personality fit** (15%): Compatible personality traits
- **Category/size match** (15%): Same category and size
- **Condition parity** (15%): Similar condition ratings
- **Rarity balance** (10%): Comparable rarity scores

### 4. Negotiation Flow

1. **Agent A** finds high compatibility with **Agent B**
2. **Agent A** proposes swap (creates `PENDING` intent)
3. On next orchestrator tick, **Agent B** evaluates proposal
4. If **Agent B** accepts, status changes to `ACCEPTED`
5. LLM generates conversation between the two garments
6. User reviews and can confirm or decline the swap
7. If confirmed, ownership transfers and swap is recorded in history

### 5. Voice Layer

When agents reach agreement, the system:
- Generates 2-3 sentence dialogues for each garment
- Selects voice profiles based on personality traits
- Synthesizes speech using ElevenLabs (if API key provided)
- Makes the algorithmic decision-making transparent and engaging

## API Endpoints

### Garments
- `GET /api/garments?ownerId={userId}` - List user's garments
- `POST /api/garments` - Create new garment
- `PUT /api/garments/:id` - Update garment
- `DELETE /api/garments/:id` - Delete garment

### Swap Intents
- `GET /api/swap-intents?ownerId={userId}&status={status}` - List swap intents
- `GET /api/swap-intents/:id` - Get specific intent with full garment details
- `POST /api/swap-intents/:id/confirm` - Confirm and execute swap
- `POST /api/swap-intents/:id/decline` - Decline swap

### Swap History
- `GET /api/swap-history?ownerId={userId}` - List completed swaps

### Utility
- `GET /api/health` - Check server status
- `POST /api/orchestrator/trigger` - Manually trigger matching cycle

## Configuration

### Compatibility Weights

Edit `src/config/weights.json` to adjust scoring:

```json
{
  "style": 0.30,
  "vibe": 0.15,
  "personality": 0.15,
  "fit": 0.15,
  "condition": 0.15,
  "rarity": 0.10
}
```

### Orchestrator Tick Interval

Default is 60 seconds. To change, edit `src/api/server.js`:

```javascript
const orchestrator = new AgentOrchestrator(supabase, llmClient, {
  tickInterval: 30000  // 30 seconds
});
```

## Project Structure

```
├── src/
│   ├── agents/
│   │   ├── ClothingAgent.js       # Garment agent class
│   │   ├── compatibility.js       # Scoring algorithms
│   │   ├── orchestrator.js        # Main orchestration loop
│   │   └── negotiation.js         # Legacy negotiation logic
│   ├── api/
│   │   └── server.js              # Express API server
│   ├── blockchain/
│   │   └── neo.js                 # Neo blockchain integration
│   ├── config/
│   │   ├── settings.js            # App configuration
│   │   └── weights.json           # Compatibility weights
│   ├── utils/
│   │   └── logger.js              # Logging utility
│   └── voice/
│       ├── dialogue.js            # LLM dialogue generation
│       └── elevenlabs.js          # Voice synthesis
├── ui/
│   ├── index.html                 # Frontend HTML
│   ├── styles.css                 # Styling
│   └── app.js                     # Frontend JavaScript
├── scripts/
│   ├── seed_data.js               # Database seeding
│   └── deploy_contract.js         # Neo contract deployment
└── contracts/
    └── GarmentSwap.cs             # Neo smart contract
```

## Design Philosophy

### Autonomous Agents Over Manual Matching

Users upload items once, then step back. Garments take over the matching process, continuously searching and negotiating without user intervention.

### Transparency Through Voice

Agent dialogues make algorithmic decisions legible. Users hear the reasoning process, creating trust and emotional resonance with the autonomous system.

### Compatibility Over Value

Matches prioritize style synergy, aesthetic alignment, and owner preferences rather than monetary value. The goal is better wardrobes, not equal trades.

### Negotiation Dynamics

Match standards gradually lower over time based on patience levels, modeling realistic negotiation behavior where items become more flexible if they remain unmatched.

## SpoonOS Integration

Red String Theory leverages the **SpoonOS Framework** for AI-powered agent decision-making:

### Core Components

1. **ToolCallAgent** - Base agent class with tool execution capabilities
2. **Custom Tools**:
   - `CompatibilityAnalysisTool` - Multi-factor garment compatibility scoring
   - `SwapFairnessEvaluationTool` - Fairness assessment for proposed swaps
3. **ChatBot** - Unified LLM access (OpenAI, Anthropic, Gemini, DeepSeek, OpenRouter)

### Agent Flow

```
Garment A detects high compatibility with Garment B
  └─→ SpoonOS GarmentDialogueAgent activates
      ├─→ Uses CompatibilityAnalysisTool
      ├─→ Uses SwapFairnessEvaluationTool
      ├─→ Generates proposal dialogue
      └─→ Generates acceptance dialogue
```

### Key Features

- **Autonomous decision-making** using SpoonOS ToolCallAgent
- **Tool-assisted analysis** for compatibility scoring
- **Multi-LLM support** via SpoonOS ChatBot
- **Fallback handling** when service unavailable

For detailed technical documentation, see [SPOONOS_INTEGRATION.md](SPOONOS_INTEGRATION.md).

## Demo User IDs

- Alice: `550e8400-e29b-41d4-a716-446655440000`
- Bob: `550e8400-e29b-41d4-a716-446655440001`

The frontend is currently configured to use Alice's account. To switch users, change the `DEMO_USER_ID` constant in `ui/app.js`.

## Future Enhancements

- Multi-party swaps (circular trades between 3+ users)
- Machine learning to improve compatibility scoring over time
- Social features (following users, curated collections)
- Mobile app for on-the-go garment management
- Integration with wardrobe management tools
- Advanced voice profiles with emotional expression
- Blockchain-verified swap history with NFT certificates

## License

ISC
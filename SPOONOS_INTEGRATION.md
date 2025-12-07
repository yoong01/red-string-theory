# SpoonOS Integration for Red String Theory

This document explains how Red String Theory integrates with the SpoonOS framework to meet hackathon requirements.

## Overview

Red String Theory uses **SpoonOS** as its core AI agent framework for autonomous garment matching and dialogue generation. The integration demonstrates:

1. **Agent → SpoonOS → LLM** invocation flow
2. **Custom tools** for compatibility analysis
3. **ToolCallAgent** for decision-making

## Architecture

### Hybrid Architecture

```
┌─────────────────────────────────────┐
│  Node.js API Server (Port 3001)     │
│  - Supabase integration             │
│  - Agent orchestration              │
│  - REST API endpoints               │
└──────────────┬──────────────────────┘
               │
               │ HTTP calls
               ▼
┌─────────────────────────────────────┐
│  SpoonOS Service (Port 5000)        │
│  - Python Flask API                 │
│  - SpoonOS ToolCallAgent            │
│  - Custom compatibility tools       │
│  - LLM integration                  │
└─────────────────────────────────────┘
```

## SpoonOS Components Used

### 1. ToolCallAgent (spoon_ai.agents.toolcall)

The `GarmentDialogueAgent` extends SpoonOS `ToolCallAgent` to facilitate autonomous garment negotiations.

**File:** `spoon_service/garment_agent.py`

```python
from spoon_ai.agents.toolcall import ToolCallAgent
from spoon_ai.chat import ChatBot
from spoon_ai.tools import ToolManager

class GarmentDialogueAgent(ToolCallAgent):
    """SpoonOS Agent for generating garment-to-garment dialogues"""

    name: str = "garment_dialogue_agent"
    description: str = "AI agent that facilitates autonomous negotiations"

    system_prompt: str = """
    You are an AI agent facilitating autonomous clothing swaps.
    Speak AS the garment (first person perspective) and analyze
    compatibility using available tools.
    """

    available_tools: ToolManager = ToolManager([
        CompatibilityAnalysisTool(),
        SwapFairnessEvaluationTool()
    ])
```

### 2. Custom Tools (spoon_ai.tools.base.BaseTool)

#### CompatibilityAnalysisTool

Analyzes garment compatibility based on multiple factors:

```python
class CompatibilityAnalysisTool(BaseTool):
    name: str = "compatibility_analysis"
    description: str = "Analyzes compatibility between two garments"

    async def execute(self, garment_a, garment_b) -> str:
        # Calculate style overlap, vibe match, condition parity
        # Returns detailed analysis report
```

**Scoring Factors:**
- Style overlap (30% weight)
- Vibe alignment (20% weight)
- Condition parity (25% weight)
- Category match (15% weight)
- Size compatibility (10% weight)

#### SwapFairnessEvaluationTool

Evaluates whether a swap is fair:

```python
class SwapFairnessEvaluationTool(BaseTool):
    name: str = "fairness_evaluation"
    description: str = "Evaluates swap fairness"

    async def execute(self, garment_a, garment_b) -> str:
        # Calculate condition fairness (60% weight)
        # Calculate rarity balance (40% weight)
        # Returns fairness assessment
```

### 3. ChatBot (spoon_ai.chat.ChatBot)

SpoonOS ChatBot provides unified LLM access:

```python
llm = ChatBot(
    llm_provider="openai",  # or anthropic, gemini, deepseek
    model_name="gpt-4o"
)

agent = GarmentDialogueAgent(llm=llm)
response = await agent.run(prompt)
```

## Complete Agent Flow

### Dialogue Generation Flow

```
1. Node.js Orchestrator detects accepted swap intent
   ├─→ Loads garment A and garment B from Supabase
   └─→ Calls SpoonOS service: POST /dialogue/generate

2. SpoonOS Service receives request
   ├─→ Creates GarmentDialogueAgent instance
   ├─→ Initializes ChatBot with configured LLM provider
   └─→ Executes agent workflow

3. GarmentDialogueAgent processes request
   ├─→ Analyzes garments using CompatibilityAnalysisTool
   ├─→ Evaluates fairness using SwapFairnessEvaluationTool
   ├─→ Generates proposal dialogue from garment A's perspective
   ├─→ Generates acceptance dialogue from garment B's perspective
   └─→ Returns structured dialogue response

4. Node.js Orchestrator receives dialogue
   ├─→ Stores dialogue in Supabase swap_intents table
   ├─→ Optionally generates voice audio (ElevenLabs)
   └─→ Makes dialogue available to frontend
```

## Setup Instructions

### 1. Install Python Dependencies

```bash
pip install -r requirements.txt
```

This installs:
- `spoon-ai-sdk` - Core SpoonOS framework
- `spoon-toolkits` - Extended tools (optional)
- `flask` and `flask-cors` - API server
- Supporting libraries

### 2. Configure LLM API Keys

Edit `.env` and add your API key:

```env
# Choose one or more providers
DEFAULT_LLM_PROVIDER=openai
DEFAULT_MODEL=gpt-4o

# API Keys (set at least one)
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
GEMINI_API_KEY=AIza...
```

### 3. Start SpoonOS Service

```bash
cd spoon_service
python server.py
```

Service starts on port 5000 and provides:
- `GET /health` - Health check
- `POST /dialogue/generate` - Generate garment dialogue
- `POST /compatibility/analyze` - Analyze compatibility with AI reasoning

### 4. Start Node.js Server

```bash
npm start
```

The Node.js server automatically calls the SpoonOS service when generating dialogues.

## Testing SpoonOS Integration

### Manual Test

Test the SpoonOS agent directly:

```bash
cd spoon_service
python garment_agent.py
```

This runs a demo showing:
1. Proposal dialogue generation
2. Acceptance dialogue generation
3. Compatibility analysis with reasoning

### API Test

Test the Flask service:

```bash
curl http://localhost:5000/health
curl -X POST http://localhost:5000/dialogue/generate \
  -H "Content-Type: application/json" \
  -d '{
    "garment_a": {
      "name": "Vintage Denim Jacket",
      "category": "Outerwear",
      "style_tags": ["vintage", "casual"],
      "personality": ["bold"],
      "vibe": "rebellious",
      "condition": 0.8,
      "size": "M"
    },
    "garment_b": {
      "name": "Black Hoodie",
      "category": "Tops",
      "style_tags": ["streetwear", "urban"],
      "personality": ["relaxed"],
      "vibe": "casual",
      "condition": 0.7,
      "size": "L"
    },
    "compatibility_score": 0.73
  }'
```

## Hackathon Requirements Compliance

### ✅ Requirement 1: Use Spoon to invoke LLM capabilities

**Implementation:**
- `GarmentDialogueAgent` extends `ToolCallAgent`
- Uses `ChatBot` for LLM access
- Demonstrates **Agent → SpoonOS → LLM** flow

**Code Reference:** `spoon_service/garment_agent.py:78-89`

```python
llm = ChatBot(
    llm_provider=provider,  # openai, anthropic, gemini, etc.
    model_name=model
)
super().__init__(llm=llm)
```

### ✅ Requirement 2: Use at least one Tool module

**Implementation:**
- Custom tools extending `BaseTool`
- `CompatibilityAnalysisTool` - Multi-factor garment analysis
- `SwapFairnessEvaluationTool` - Fairness assessment

**Code Reference:** `spoon_service/garment_agent.py:16-85`

Both tools are registered with `ToolManager` and available to the agent:

```python
available_tools: ToolManager = ToolManager([
    CompatibilityAnalysisTool(),
    SwapFairnessEvaluationTool()
])
```

## Agent Capabilities

### 1. Autonomous Dialogue Generation

Agents generate natural conversations between garments:

**Input:**
- Two garment profiles
- Compatibility score

**Output:**
- Proposal from garment A
- Acceptance from garment B
- Both reference specific compatibility factors

**Example:**
> "I've been analyzing our streetwear overlap at 73%, and your urban edge complements my vintage authenticity. Our condition ratings (8/10 vs 7/10) suggest a fair trade that benefits both our next owners."

### 2. Tool-Assisted Analysis

Agents use tools to make informed decisions:

**CompatibilityAnalysisTool provides:**
- Detailed score breakdown
- Shared style identification
- Match assessment (strong/moderate/weak)

**SwapFairnessEvaluationTool provides:**
- Condition fairness calculation
- Rarity balance assessment
- Overall fairness rating

### 3. Personality-Driven Communication

Agents adapt their communication style based on garment personality:
- **Bold**: Confident, assertive language
- **Refined**: Sophisticated, elegant phrasing
- **Relaxed**: Casual, easygoing tone
- **Chaotic**: Energetic, unpredictable style

## Future Enhancements

### Potential SpoonOS Extensions

1. **Memory Module**
   - Track past negotiations
   - Learn from successful swaps
   - Improve matching over time

2. **Multi-Agent Negotiation**
   - Multiple garments negotiate simultaneously
   - Circular trade chains (A→B→C→A)
   - Collaborative decision-making

3. **MCP Integration**
   - Dynamic tool discovery
   - External data sources
   - Real-time fashion trend analysis

4. **Advanced Tools**
   - Web search for style trends
   - Image analysis for garment verification
   - Market value estimation

## Troubleshooting

### SpoonOS Service Won't Start

**Issue:** Missing dependencies

**Solution:**
```bash
pip install --upgrade -r requirements.txt
```

### LLM API Errors

**Issue:** API key not configured

**Solution:** Set environment variable:
```bash
export OPENAI_API_KEY=sk-...
# or edit .env file
```

### Node.js Can't Connect to SpoonOS

**Issue:** Service not running on port 5000

**Solution:**
```bash
# Check if service is running
curl http://localhost:5000/health

# Start service if needed
cd spoon_service && python server.py
```

### Fallback Mode

If SpoonOS service is unavailable, the system automatically uses fallback dialogues. This ensures the system remains functional even without SpoonOS, but AI-generated dialogues are only available when SpoonOS is running.

## Conclusion

Red String Theory's SpoonOS integration demonstrates:

- **Full agent framework adoption** with ToolCallAgent
- **Custom tool development** for domain-specific analysis
- **Production-ready architecture** with fallback handling
- **Clean separation of concerns** between Node.js orchestration and Python AI logic

The system meets all hackathon requirements while maintaining flexibility and extensibility for future enhancements.

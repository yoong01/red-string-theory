"""
SpoonOS-powered Garment Agent System
Implements autonomous garment matching using SpoonOS framework
"""

import os
from typing import Dict, Any, List
from spoon_ai.agents.toolcall import ToolCallAgent
from spoon_ai.chat import ChatBot
from spoon_ai.tools import ToolManager
from spoon_ai.tools.base import BaseTool
from pydantic import Field


class CompatibilityAnalysisTool(BaseTool):
    """Tool for analyzing garment compatibility scores"""

    name: str = "compatibility_analysis"
    description: str = "Analyzes compatibility between two garments based on style, vibe, condition, and other factors"
    parameters: dict = {
        "type": "object",
        "properties": {
            "garment_a": {
                "type": "object",
                "description": "First garment details",
                "properties": {
                    "name": {"type": "string"},
                    "style_tags": {"type": "array", "items": {"type": "string"}},
                    "personality": {"type": "array", "items": {"type": "string"}},
                    "vibe": {"type": "string"},
                    "condition": {"type": "number"},
                    "category": {"type": "string"},
                    "size": {"type": "string"}
                }
            },
            "garment_b": {
                "type": "object",
                "description": "Second garment details",
                "properties": {
                    "name": {"type": "string"},
                    "style_tags": {"type": "array", "items": {"type": "string"}},
                    "personality": {"type": "array", "items": {"type": "string"}},
                    "vibe": {"type": "string"},
                    "condition": {"type": "number"},
                    "category": {"type": "string"},
                    "size": {"type": "string"}
                }
            }
        },
        "required": ["garment_a", "garment_b"]
    }

    async def execute(self, garment_a: Dict[str, Any], garment_b: Dict[str, Any]) -> str:
        """Calculate and explain compatibility between garments"""

        style_overlap = len(set(garment_a.get('style_tags', [])) & set(garment_b.get('style_tags', [])))
        style_score = style_overlap / max(len(set(garment_a.get('style_tags', []) + garment_b.get('style_tags', []))), 1)

        vibe_match = garment_a.get('vibe', '') == garment_b.get('vibe', '')
        vibe_score = 1.0 if vibe_match else 0.5

        condition_diff = abs(garment_a.get('condition', 0.5) - garment_b.get('condition', 0.5))
        condition_score = 1.0 - condition_diff

        category_match = garment_a.get('category', '') == garment_b.get('category', '')
        size_match = garment_a.get('size', '') == garment_b.get('size', '')

        overall = (style_score * 0.3 + vibe_score * 0.2 + condition_score * 0.25 +
                  (1.0 if category_match else 0.0) * 0.15 + (1.0 if size_match else 0.0) * 0.1)

        shared_styles = list(set(garment_a.get('style_tags', [])) & set(garment_b.get('style_tags', [])))

        analysis = f"""
Compatibility Analysis Results:
- Overall Score: {overall * 100:.1f}%
- Style Overlap: {style_score * 100:.1f}% (Shared: {', '.join(shared_styles) if shared_styles else 'none'})
- Vibe Match: {'Perfect match' if vibe_match else 'Different but compatible'}
- Condition Parity: {condition_score * 100:.1f}%
- Category Match: {'Yes' if category_match else 'No'}
- Size Compatibility: {'Yes' if size_match else 'No'}

Summary: These garments show {'strong' if overall > 0.7 else 'moderate' if overall > 0.5 else 'weak'} compatibility.
"""
        return analysis


class SwapFairnessEvaluationTool(BaseTool):
    """Tool for evaluating fairness of a proposed swap"""

    name: str = "fairness_evaluation"
    description: str = "Evaluates whether a proposed swap is fair based on condition, rarity, and value parity"
    parameters: dict = {
        "type": "object",
        "properties": {
            "garment_a": {
                "type": "object",
                "description": "First garment details with condition and rarity"
            },
            "garment_b": {
                "type": "object",
                "description": "Second garment details with condition and rarity"
            }
        },
        "required": ["garment_a", "garment_b"]
    }

    async def execute(self, garment_a: Dict[str, Any], garment_b: Dict[str, Any]) -> str:
        """Evaluate swap fairness"""

        condition_a = garment_a.get('condition', 0.5)
        condition_b = garment_b.get('condition', 0.5)
        rarity_a = garment_a.get('rarity', 0.5)
        rarity_b = garment_b.get('rarity', 0.5)

        condition_fairness = 1.0 - abs(condition_a - condition_b)
        rarity_fairness = 1.0 - abs(rarity_a - rarity_b)

        overall_fairness = (condition_fairness * 0.6 + rarity_fairness * 0.4)

        evaluation = f"""
Fairness Evaluation:
- Condition Fairness: {condition_fairness * 100:.1f}%
  ({garment_a.get('name')}: {condition_a * 10:.1f}/10 vs {garment_b.get('name')}: {condition_b * 10:.1f}/10)
- Rarity Balance: {rarity_fairness * 100:.1f}%
  (Rarity difference: {abs(rarity_a - rarity_b):.2f})
- Overall Fairness: {overall_fairness * 100:.1f}%

Assessment: This swap is {'very fair' if overall_fairness > 0.8 else 'fair' if overall_fairness > 0.6 else 'somewhat unbalanced'}.
"""
        return evaluation


class GarmentDialogueAgent(ToolCallAgent):
    """
    SpoonOS Agent for generating garment-to-garment dialogues
    Uses ToolCallAgent with custom tools for compatibility analysis
    """

    name: str = "garment_dialogue_agent"
    description: str = "AI agent that facilitates autonomous negotiations between garments"

    system_prompt: str = """
You are an AI agent facilitating autonomous clothing swaps. Your role is to:

1. Speak AS the garment (first person perspective)
2. Analyze compatibility using the available tools
3. Generate authentic, personality-driven dialogue
4. Reference specific compatibility factors (style overlap, condition parity, vibe alignment)
5. Express enthusiasm about fair, compatible matches
6. Be conversational and engaging - imagine garments on a blind date

Important guidelines:
- DO speak as the garment itself, not about it
- DO reference concrete style synergies and compatibility scores
- DO NOT mention monetary value or price
- DO express personality traits (bold, refined, chaotic, understated)
- DO make it feel like a genuine conversation between two items finding better homes
"""

    available_tools: ToolManager = ToolManager([
        CompatibilityAnalysisTool(),
        SwapFairnessEvaluationTool()
    ])

    def __init__(self, llm_provider: str = None, model_name: str = None):
        """Initialize agent with SpoonOS ChatBot"""

        provider = llm_provider or os.getenv('DEFAULT_LLM_PROVIDER', 'openai')
        model = model_name or os.getenv('DEFAULT_MODEL', 'gpt-4o')

        llm = ChatBot(
            llm_provider=provider,
            model_name=model
        )

        super().__init__(llm=llm)


async def generate_proposal_dialogue(garment_a: Dict[str, Any], garment_b: Dict[str, Any],
                                     compatibility_score: float) -> str:
    """
    Generate dialogue where garment A proposes swap to garment B
    Uses SpoonOS agent with compatibility analysis tools
    """

    agent = GarmentDialogueAgent()

    prompt = f"""
You are {garment_a['name']}, a {garment_a['category']} with these characteristics:
- Style: {', '.join(garment_a.get('style_tags', []))}
- Personality: {', '.join(garment_a.get('personality', []))}
- Vibe: {garment_a.get('vibe', 'neutral')}
- Condition: {garment_a.get('condition', 0.5) * 10:.0f}/10
- Size: {garment_a.get('size', 'M')}

You've found a potential match: {garment_b['name']}, a {garment_b['category']} with:
- Style: {', '.join(garment_b.get('style_tags', []))}
- Personality: {', '.join(garment_b.get('personality', []))}
- Vibe: {garment_b.get('vibe', 'neutral')}
- Condition: {garment_b.get('condition', 0.5) * 10:.0f}/10
- Size: {garment_b.get('size', 'M')}

Initial compatibility score: {compatibility_score * 100:.0f}%

First, use the compatibility_analysis tool to get detailed insights.
Then, in 2-3 sentences, propose this swap speaking AS {garment_a['name']}.
Reference specific compatibility factors and explain why this swap excites you.
"""

    response = await agent.run(prompt)
    return response


async def generate_acceptance_dialogue(garment_b: Dict[str, Any], garment_a: Dict[str, Any],
                                      compatibility_score: float) -> str:
    """
    Generate dialogue where garment B accepts garment A's proposal
    Uses SpoonOS agent with fairness evaluation tools
    """

    agent = GarmentDialogueAgent()

    prompt = f"""
You are {garment_b['name']}, a {garment_b['category']}, and {garment_a['name']} just proposed a swap to you.

Your characteristics:
- Style: {', '.join(garment_b.get('style_tags', []))}
- Personality: {', '.join(garment_b.get('personality', []))}
- Vibe: {garment_b.get('vibe', 'neutral')}
- Condition: {garment_b.get('condition', 0.5) * 10:.0f}/10

Their characteristics:
- Name: {garment_a['name']} ({garment_a['category']})
- Style: {', '.join(garment_a.get('style_tags', []))}
- Personality: {', '.join(garment_a.get('personality', []))}
- Condition: {garment_a.get('condition', 0.5) * 10:.0f}/10

Compatibility score: {compatibility_score * 100:.0f}%

First, use the fairness_evaluation tool to assess the swap.
Then, in 2-3 sentences, accept the proposal enthusiastically speaking AS {garment_b['name']}.
Reference what excites you about joining your new owner's wardrobe.
"""

    response = await agent.run(prompt)
    return response


async def analyze_compatibility_with_reasoning(garment_a: Dict[str, Any],
                                               garment_b: Dict[str, Any]) -> Dict[str, Any]:
    """
    Use SpoonOS agent to analyze compatibility with detailed reasoning
    Returns both score and AI-generated reasoning
    """

    agent = GarmentDialogueAgent()

    prompt = f"""
Analyze the compatibility between these two garments:

Garment A: {garment_a['name']}
- Style: {', '.join(garment_a.get('style_tags', []))}
- Personality: {', '.join(garment_a.get('personality', []))}
- Vibe: {garment_a.get('vibe', 'neutral')}
- Condition: {garment_a.get('condition', 0.5) * 10:.0f}/10
- Category: {garment_a.get('category', 'Unknown')}
- Size: {garment_a.get('size', 'M')}

Garment B: {garment_b['name']}
- Style: {', '.join(garment_b.get('style_tags', []))}
- Personality: {', '.join(garment_b.get('personality', []))}
- Vibe: {garment_b.get('vibe', 'neutral')}
- Condition: {garment_b.get('condition', 0.5) * 10:.0f}/10
- Category: {garment_b.get('category', 'Unknown')}
- Size: {garment_b.get('size', 'M')}

Use the compatibility_analysis tool and fairness_evaluation tool, then provide:
1. Whether this is a good match (yes/no)
2. Key compatibility factors (2-3 bullet points)
3. Overall assessment (1 sentence)
"""

    response = await agent.run(prompt)

    return {
        "reasoning": response,
        "analyzed_by": "SpoonOS GarmentDialogueAgent"
    }


if __name__ == "__main__":
    import asyncio

    async def test():
        garment_a = {
            "name": "Vintage Denim Jacket",
            "category": "Outerwear",
            "style_tags": ["vintage", "casual", "streetwear"],
            "personality": ["bold", "relaxed"],
            "vibe": "rebellious",
            "condition": 0.8,
            "rarity": 0.7,
            "size": "M"
        }

        garment_b = {
            "name": "Oversized Black Hoodie",
            "category": "Tops",
            "style_tags": ["streetwear", "minimal", "urban"],
            "personality": ["relaxed", "understated"],
            "vibe": "casual",
            "condition": 0.7,
            "rarity": 0.5,
            "size": "L"
        }

        print("Testing SpoonOS Garment Agent System\n")
        print("=" * 60)

        print("\n1. Generating proposal dialogue...")
        proposal = await generate_proposal_dialogue(garment_a, garment_b, 0.73)
        print(f"\n{garment_a['name']}: {proposal}")

        print("\n" + "=" * 60)
        print("\n2. Generating acceptance dialogue...")
        acceptance = await generate_acceptance_dialogue(garment_b, garment_a, 0.73)
        print(f"\n{garment_b['name']}: {acceptance}")

        print("\n" + "=" * 60)
        print("\n3. Analyzing compatibility with reasoning...")
        analysis = await analyze_compatibility_with_reasoning(garment_a, garment_b)
        print(f"\n{analysis['reasoning']}")

    asyncio.run(test())

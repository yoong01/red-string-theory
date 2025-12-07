"""
SpoonOS Service for Red String Theory
Autonomous garment agent system powered by SpoonOS Framework
"""

from .garment_agent import (
    GarmentDialogueAgent,
    CompatibilityAnalysisTool,
    SwapFairnessEvaluationTool,
    generate_proposal_dialogue,
    generate_acceptance_dialogue,
    analyze_compatibility_with_reasoning
)

__all__ = [
    'GarmentDialogueAgent',
    'CompatibilityAnalysisTool',
    'SwapFairnessEvaluationTool',
    'generate_proposal_dialogue',
    'generate_acceptance_dialogue',
    'analyze_compatibility_with_reasoning'
]

__version__ = '1.0.0'

"""
SpoonOS Service API
Flask server exposing garment agent functionality
"""

import os
import asyncio
from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv

from garment_agent import (
    generate_proposal_dialogue,
    generate_acceptance_dialogue,
    analyze_compatibility_with_reasoning
)

load_dotenv()

app = Flask(__name__)
CORS(app)


@app.route('/health', methods=['GET'])
def health():
    """Health check endpoint"""
    return jsonify({
        "status": "ok",
        "service": "SpoonOS Garment Agent Service",
        "llm_provider": os.getenv('DEFAULT_LLM_PROVIDER', 'openai')
    })


@app.route('/dialogue/generate', methods=['POST'])
def generate_dialogue():
    """
    Generate complete dialogue between two garments
    Expects: garment_a, garment_b, compatibility_score
    """
    try:
        data = request.json
        garment_a = data.get('garment_a')
        garment_b = data.get('garment_b')
        compatibility_score = data.get('compatibility_score', 0.7)

        if not garment_a or not garment_b:
            return jsonify({"error": "Missing garment data"}), 400

        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)

        proposal = loop.run_until_complete(
            generate_proposal_dialogue(garment_a, garment_b, compatibility_score)
        )

        acceptance = loop.run_until_complete(
            generate_acceptance_dialogue(garment_b, garment_a, compatibility_score)
        )

        loop.close()

        return jsonify({
            "garmentA": {
                "name": garment_a['name'],
                "text": proposal
            },
            "garmentB": {
                "name": garment_b['name'],
                "text": acceptance
            },
            "compatibility": int(compatibility_score * 100),
            "powered_by": "SpoonOS Framework"
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route('/compatibility/analyze', methods=['POST'])
def analyze_compatibility():
    """
    Analyze compatibility between two garments with AI reasoning
    Expects: garment_a, garment_b
    """
    try:
        data = request.json
        garment_a = data.get('garment_a')
        garment_b = data.get('garment_b')

        if not garment_a or not garment_b:
            return jsonify({"error": "Missing garment data"}), 400

        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)

        analysis = loop.run_until_complete(
            analyze_compatibility_with_reasoning(garment_a, garment_b)
        )

        loop.close()

        return jsonify(analysis)

    except Exception as e:
        return jsonify({"error": str(e)}), 500


if __name__ == '__main__':
    port = int(os.getenv('SPOON_SERVICE_PORT', 5000))
    print(f"Starting SpoonOS Garment Agent Service on port {port}")
    print(f"LLM Provider: {os.getenv('DEFAULT_LLM_PROVIDER', 'openai')}")
    app.run(host='0.0.0.0', port=port, debug=False)

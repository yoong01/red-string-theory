const logger = require('../utils/logger');
const axios = require('axios');

const SPOON_SERVICE_URL = process.env.SPOON_SERVICE_URL || 'http://localhost:5000';

function generateProposalPrompt(garmentA, garmentB, compatibility) {
  const styleOverlap = garmentA.style_tags.filter(tag =>
    garmentB.style_tags.includes(tag)
  ).join(', ');

  return `You are ${garmentA.name}, a ${garmentA.category} in a garment swap platform. You're speaking directly to another item proposing a trade.

Your profile:
- Style: ${garmentA.style_tags.join(', ')}
- Personality: ${garmentA.personality.join(', ')}
- Vibe: ${garmentA.vibe}
- Condition: ${Math.round(garmentA.condition * 10)}/10
- Size: ${garmentA.size}

Their profile:
- Name: ${garmentB.name}
- Style: ${garmentB.style_tags.join(', ')}
- Personality: ${garmentB.personality.join(', ')}
- Vibe: ${garmentB.vibe}
- Condition: ${Math.round(garmentB.condition * 10)}/10
- Size: ${garmentB.size}

Compatibility score: ${Math.round(compatibility.total * 100)}%
${styleOverlap ? `Shared styles: ${styleOverlap}` : ''}

In 2-3 sentences, speak AS this ${garmentA.category} explaining why you want to swap with ${garmentB.name}. Be conversational and focus on style synergies, aesthetic alignment, and how both items will find better homes. Don't mention monetary value. Speak like you're on a blind date with the other item.`;
}

function generateAcceptancePrompt(garmentB, garmentA, compatibility) {
  const styleOverlap = garmentB.style_tags.filter(tag =>
    garmentA.style_tags.includes(tag)
  ).join(', ');

  return `You are ${garmentB.name}, a ${garmentB.category} in a garment swap platform. ${garmentA.name} just proposed a trade to you.

Your profile:
- Style: ${garmentB.style_tags.join(', ')}
- Personality: ${garmentB.personality.join(', ')}
- Vibe: ${garmentB.vibe}
- Condition: ${Math.round(garmentB.condition * 10)}/10
- Size: ${garmentB.size}

Their profile:
- Name: ${garmentA.name}
- Style: ${garmentA.style_tags.join(', ')}
- Personality: ${garmentA.personality.join(', ')}
- Vibe: ${garmentA.vibe}
- Condition: ${Math.round(garmentA.condition * 10)}/10
- Size: ${garmentA.size}

Compatibility score: ${Math.round(compatibility.total * 100)}%
${styleOverlap ? `Shared styles: ${styleOverlap}` : ''}

In 2-3 sentences, respond to ${garmentA.name}'s proposal with enthusiasm and acceptance. Speak AS this ${garmentB.category}. Reference what excites you about the swap and how you'll benefit your new owner. Be warm and personality-driven.`;
}

async function generateDialogue(garmentA, garmentB, compatibility, llmClient) {
  try {
    logger.info(`Calling SpoonOS service at ${SPOON_SERVICE_URL} for dialogue generation`);

    const response = await axios.post(`${SPOON_SERVICE_URL}/dialogue/generate`, {
      garment_a: {
        name: garmentA.name,
        category: garmentA.category,
        style_tags: garmentA.style_tags || [],
        personality: garmentA.personality || [],
        vibe: garmentA.vibe || 'neutral',
        condition: garmentA.condition,
        rarity: garmentA.rarity || 0.5,
        size: garmentA.size
      },
      garment_b: {
        name: garmentB.name,
        category: garmentB.category,
        style_tags: garmentB.style_tags || [],
        personality: garmentB.personality || [],
        vibe: garmentB.vibe || 'neutral',
        condition: garmentB.condition,
        rarity: garmentB.rarity || 0.5,
        size: garmentB.size
      },
      compatibility_score: compatibility.total
    }, {
      timeout: 30000
    });

    const spoonData = response.data;

    const dialogue = {
      garmentA: {
        name: garmentA.name,
        text: spoonData.garmentA.text
      },
      garmentB: {
        name: garmentB.name,
        text: spoonData.garmentB.text
      },
      compatibility: Math.round(compatibility.total * 100),
      fairness: Math.round(compatibility.fairness * 100),
      powered_by: 'SpoonOS Framework'
    };

    logger.info(`Successfully generated dialogue using SpoonOS between ${garmentA.name} and ${garmentB.name}`);
    return dialogue;

  } catch (error) {
    logger.warn(`SpoonOS service unavailable (${error.message}), using fallback dialogue`);

    return {
      garmentA: {
        name: garmentA.name,
        text: `I've been analyzing potential matches, and I think we could work well together. We both thrive in the ${garmentA.style_tags[0] || 'modern'} aesthetic, and our condition ratings are close (${Math.round(garmentA.condition * 10)} vs ${Math.round(garmentB.condition * 10)}). This feels fair.`
      },
      garmentB: {
        name: garmentB.name,
        text: `I appreciate the vintage credibility you'd bring to my next owner. The streetwear synergy is real—I can see us both getting more wear in a rotation that values that aesthetic. I'm accepting this swap with ${Math.round(compatibility.total * 100)}% compatibility confidence.`
      },
      compatibility: Math.round(compatibility.total * 100),
      fairness: Math.round(compatibility.fairness * 100),
      powered_by: 'Fallback (SpoonOS unavailable)'
    };
  }
}

module.exports = {
  generateDialogue,
  generateProposalPrompt,
  generateAcceptancePrompt
};

const logger = require('../utils/logger');

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
    const proposalPrompt = generateProposalPrompt(garmentA, garmentB, compatibility);
    const acceptancePrompt = generateAcceptancePrompt(garmentB, garmentA, compatibility);

    const proposalResponse = await llmClient.chat({
      messages: [{ role: 'user', content: proposalPrompt }],
      temperature: 0.8,
      max_tokens: 150
    });

    const acceptanceResponse = await llmClient.chat({
      messages: [{ role: 'user', content: acceptancePrompt }],
      temperature: 0.8,
      max_tokens: 150
    });

    const dialogue = {
      garmentA: {
        name: garmentA.name,
        text: proposalResponse.content || proposalResponse
      },
      garmentB: {
        name: garmentB.name,
        text: acceptanceResponse.content || acceptanceResponse
      },
      compatibility: Math.round(compatibility.total * 100),
      fairness: Math.round(compatibility.fairness * 100)
    };

    logger.info(`Generated dialogue between ${garmentA.name} and ${garmentB.name}`);
    return dialogue;

  } catch (error) {
    logger.error(`Error generating dialogue: ${error.message}`);

    return {
      garmentA: {
        name: garmentA.name,
        text: `I've been analyzing potential matches, and I think we could work well together. We both thrive in the ${garmentA.style_tags[0] || 'modern'} aesthetic, and our condition ratings are close (${Math.round(garmentA.condition * 10)} vs ${Math.round(garmentB.condition * 10)}). This feels fair.`
      },
      garmentB: {
        name: garmentB.name,
        text: `I appreciate the vintage credibility you'd bring to my next owner. The streetwear synergy is realI can see us both getting more wear in a rotation that values that aesthetic. I'm accepting this swap with ${Math.round(compatibility.total * 100)}% compatibility confidence.`
      },
      compatibility: Math.round(compatibility.total * 100),
      fairness: Math.round(compatibility.fairness * 100)
    };
  }
}

module.exports = {
  generateDialogue,
  generateProposalPrompt,
  generateAcceptancePrompt
};

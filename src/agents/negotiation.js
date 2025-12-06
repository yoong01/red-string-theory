// Determines if a proposed swap is acceptable to the agent
function isSwapAcceptable(agent, otherClothes, compatibility) {
    // min score threshold (can be tweaked)
    const minScore = 0.5;
  
    // reduce threshold if agent patience is high
    const adjustedThreshold = minScore - agent.patience * 0.2;
  
    return compatibility >= adjustedThreshold;
  }
  
  // Simulate patience decay after a tick
  function decayPatience(agent) {
    agent.patience -= 0.05; // reduce patience slightly each tick
    if (agent.patience < 0) agent.patience = 0;
  }
  
  module.exports = { isSwapAcceptable, decayPatience };
  
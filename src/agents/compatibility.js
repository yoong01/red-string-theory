function styleScore(garmentA, garmentB) {
  const tagsA = new Set(garmentA.style_tags);
  const tagsB = new Set(garmentB.style_tags);

  const allTags = new Set([...garmentA.style_tags, ...garmentB.style_tags]);
  if (allTags.size === 0) return 0;

  const intersection = [...tagsA].filter(tag => tagsB.has(tag));
  return intersection.length / allTags.size;
}

function vibeScore(garmentA, garmentB) {
  if (!garmentA.vibe || !garmentB.vibe) return 0.5;
  return garmentA.vibe === garmentB.vibe ? 1.0 : 0.5;
}

function personalityScore(garmentA, garmentB) {
  const persA = new Set(garmentA.personality || []);
  const persB = new Set(garmentB.personality || []);

  const allPersonality = new Set([...(garmentA.personality || []), ...(garmentB.personality || [])]);
  if (allPersonality.size === 0) return 0.5;

  const intersection = [...persA].filter(p => persB.has(p));
  return intersection.length / allPersonality.size;
}

function categorySizeScore(garmentA, garmentB) {
  const categoryMatch = garmentA.category === garmentB.category ? 1.0 : 0.0;
  const sizeMatch = garmentA.size === garmentB.size ? 1.0 : 0.5;
  return (categoryMatch * 0.7 + sizeMatch * 0.3);
}

function conditionScore(garmentA, garmentB) {
  const diff = Math.abs(garmentA.condition - garmentB.condition);
  return 1.0 - diff;
}

function rarityScore(garmentA, garmentB) {
  const diff = Math.abs(garmentA.rarity - garmentB.rarity);
  return 1.0 - diff;
}

function fairnessScore(garmentA, garmentB) {
  const conditionFairness = 1.0 - Math.abs(garmentA.condition - garmentB.condition);
  const rarityFairness = 1.0 - Math.abs(garmentA.rarity - garmentB.rarity);
  return (conditionFairness * 0.6 + rarityFairness * 0.4);
}

function calculateCompatibility(garmentA, garmentB, weights) {
  const defaultWeights = {
    style: 0.30,
    vibe: 0.15,
    personality: 0.15,
    fit: 0.15,
    condition: 0.15,
    rarity: 0.10
  };

  const w = { ...defaultWeights, ...weights };

  const scores = {
    style: styleScore(garmentA, garmentB),
    vibe: vibeScore(garmentA, garmentB),
    personality: personalityScore(garmentA, garmentB),
    fit: categorySizeScore(garmentA, garmentB),
    condition: conditionScore(garmentA, garmentB),
    rarity: rarityScore(garmentA, garmentB)
  };

  const total =
    w.style * scores.style +
    w.vibe * scores.vibe +
    w.personality * scores.personality +
    w.fit * scores.fit +
    w.condition * scores.condition +
    w.rarity * scores.rarity;

  return {
    total: Math.min(1.0, Math.max(0, total)),
    breakdown: scores,
    fairness: fairnessScore(garmentA, garmentB)
  };
}

function shouldProposeSwap(garment, otherGarment, compatibility) {
  if (!garment.active || !otherGarment.active) return false;
  if (garment.owner_id === otherGarment.owner_id) return false;

  const meetsThreshold = compatibility.total >= garment.min_acceptable_score;
  const fairEnough = compatibility.fairness >= 0.5;

  return meetsThreshold && fairEnough;
}

function degradeStandards(garment, daysUnmatched) {
  const degradationRate = (1 - garment.patience) * 0.01;
  const reduction = degradationRate * daysUnmatched;
  return Math.max(0.4, garment.min_acceptable_score - reduction);
}

module.exports = {
  styleScore,
  vibeScore,
  personalityScore,
  categorySizeScore,
  conditionScore,
  rarityScore,
  fairnessScore,
  calculateCompatibility,
  shouldProposeSwap,
  degradeStandards
};
  
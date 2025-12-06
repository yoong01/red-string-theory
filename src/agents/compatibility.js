// Calculates compatibility between two pieces of clothing
function styleScore(clothesA, clothesB) {
    // count how many style tags match
    const matches = clothesA.style_tags.filter(tag => clothesB.style_tags.includes(tag));
    return matches.length / Math.max(clothesA.style_tags.length, clothesB.style_tags.length);
  }
  
  function vibeScore(clothesA, clothesB) {
    // 1 if vibes match, 0.5 if similar (example), 0 if different
    return clothesA.vibe === clothesB.vibe ? 1 : 0.5;
  }
  
  function conditionScore(clothesA, clothesB) {
    // average condition score (0-1)
    return (clothesA.condition + clothesB.condition) / 2;
  }
  
  function rarityScore(clothesA, clothesB) {
    // average rarity (0-1)
    return (clothesA.rarity + clothesB.rarity) / 2;
  }
  
  // Total compatibility is weighted sum of factors
  function totalCompatibility(clothesA, clothesB) {
    const style = styleScore(clothesA, clothesB);
    const vibe = vibeScore(clothesA, clothesB);
    const condition = conditionScore(clothesA, clothesB);
    const rarity = rarityScore(clothesA, clothesB);
  
    // simple weights: style 40%, vibe 20%, condition 20%, rarity 20%
    return style * 0.4 + vibe * 0.2 + condition * 0.2 + rarity * 0.2;
  }
  
  module.exports = {
    styleScore,
    vibeScore,
    conditionScore,
    rarityScore,
    totalCompatibility
  };
  
const { totalCompatibility } = require('./compatibility');
const { isSwapAcceptable, decayPatience } = require('./negotiation');

class ClothingAgent {
  constructor(clothing) {
    this.id = clothing.id;
    this.name = clothing.name;
    this.category = clothing.category;
    this.size = clothing.size;
    this.style_tags = clothing.style_tags;
    this.vibe = clothing.vibe;
    this.condition = clothing.condition;
    this.rarity = clothing.rarity;
    this.patience = clothing.patience || 0.5; // default patience
    this.owner_id = clothing.owner_id;

    this.swapsProposed = []; // keep track of swaps this agent proposes
  }

  // Tick simulates one agent "thinking" step
  tick(allClothes) {
    decayPatience(this);

    // propose swaps with compatible clothes
    allClothes.forEach(other => {
      if (other.id === this.id) return; // skip self

      const compatibility = totalCompatibility(this, other);

      if (isSwapAcceptable(this, other, compatibility)) {
        // simulate proposing a swap
        this.swapsProposed.push({
          with: other.id,
          score: compatibility
        });
        console.log(`${this.name} proposes swap with ${other.name} (score: ${compatibility.toFixed(2)})`);
      }
    });
  }
}

module.exports = ClothingAgent;

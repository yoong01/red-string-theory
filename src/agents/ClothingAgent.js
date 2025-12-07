const { calculateCompatibility, shouldProposeSwap, degradeStandards } = require('./compatibility');
const logger = require('../utils/logger');

class GarmentAgent {
  constructor(garment, supabaseClient, weights) {
    this.id = garment.id;
    this.name = garment.name;
    this.category = garment.category;
    this.size = garment.size;
    this.style_tags = garment.style_tags || [];
    this.personality = garment.personality || [];
    this.vibe = garment.vibe || '';
    this.condition = garment.condition;
    this.rarity = garment.rarity;
    this.patience = garment.patience || 0.5;
    this.min_acceptable_score = garment.min_acceptable_score || 0.65;
    this.owner_id = garment.owner_id;
    this.active = garment.active !== false;
    this.last_match_attempt = garment.last_match_attempt;
    this.image_url = garment.image_url;

    this.supabase = supabaseClient;
    this.weights = weights;
  }

  async tick(allGarments) {
    if (!this.active || !this.owner_id) {
      return null;
    }

    const daysSinceLastAttempt = this.getDaysSinceLastAttempt();
    if (daysSinceLastAttempt > 7) {
      await this.updateMinAcceptableScore(daysSinceLastAttempt);
    }

    const candidates = allGarments.filter(g =>
      g.id !== this.id &&
      g.owner_id !== this.owner_id &&
      g.active
    );

    let bestMatch = null;
    let bestCompatibility = null;
    let bestScore = 0;

    for (const other of candidates) {
      const compatibility = calculateCompatibility(this, other, this.weights);

      if (shouldProposeSwap(this, other, compatibility) && compatibility.total > bestScore) {
        bestScore = compatibility.total;
        bestCompatibility = compatibility;
        bestMatch = other;
      }
    }

    if (bestMatch && bestCompatibility) {
      const existingIntent = await this.checkExistingIntent(bestMatch.id);

      if (!existingIntent) {
        const swapIntent = await this.createSwapIntent(bestMatch, bestCompatibility);
        logger.info(`${this.name} proposes swap with ${bestMatch.name} (compatibility: ${(bestCompatibility.total * 100).toFixed(0)}%, fairness: ${(bestCompatibility.fairness * 100).toFixed(0)}%)`);
        return swapIntent;
      }
    }

    await this.updateLastMatchAttempt();
    return null;
  }

  async handleProposal(swapIntent, proposingGarment) {
    if (swapIntent.status !== 'PENDING') {
      return { accepted: false, reason: 'Intent not pending' };
    }

    const compatibility = calculateCompatibility(proposingGarment, this, this.weights);

    if (shouldProposeSwap(this, proposingGarment, compatibility)) {
      const { data, error } = await this.supabase
        .from('swap_intents')
        .update({
          status: 'ACCEPTED',
          responded_at: new Date().toISOString()
        })
        .eq('id', swapIntent.id)
        .select()
        .maybeSingle();

      if (error) {
        logger.error(`Error accepting swap intent: ${error.message}`);
        return { accepted: false, error: error.message };
      }

      logger.info(`${this.name} accepts swap with ${proposingGarment.name}`);
      return { accepted: true, intent: data };
    } else {
      const { data, error } = await this.supabase
        .from('swap_intents')
        .update({
          status: 'DECLINED',
          responded_at: new Date().toISOString()
        })
        .eq('id', swapIntent.id)
        .select()
        .maybeSingle();

      if (error) {
        logger.error(`Error declining swap intent: ${error.message}`);
      }

      logger.info(`${this.name} declines swap with ${proposingGarment.name} (score: ${(compatibility.total * 100).toFixed(0)}% < threshold: ${(this.min_acceptable_score * 100).toFixed(0)}%)`);
      return { accepted: false, reason: 'Below threshold' };
    }
  }

  async createSwapIntent(otherGarment, compatibility) {
    const { data, error } = await this.supabase
      .from('swap_intents')
      .insert({
        garment_a_id: this.id,
        garment_b_id: otherGarment.id,
        owner_a_id: this.owner_id,
        owner_b_id: otherGarment.owner_id,
        status: 'PENDING',
        compatibility_score: compatibility.total,
        fairness_score: compatibility.fairness,
        proposed_at: new Date().toISOString()
      })
      .select()
      .maybeSingle();

    if (error) {
      logger.error(`Error creating swap intent: ${error.message}`);
      return null;
    }

    return data;
  }

  async checkExistingIntent(otherGarmentId) {
    const { data, error } = await this.supabase
      .from('swap_intents')
      .select('*')
      .or(`and(garment_a_id.eq.${this.id},garment_b_id.eq.${otherGarmentId}),and(garment_a_id.eq.${otherGarmentId},garment_b_id.eq.${this.id})`)
      .in('status', ['PENDING', 'ACCEPTED'])
      .maybeSingle();

    if (error && error.code !== 'PGRST116') {
      logger.error(`Error checking existing intent: ${error.message}`);
    }

    return data;
  }

  async updateLastMatchAttempt() {
    const { error } = await this.supabase
      .from('garments')
      .update({ last_match_attempt: new Date().toISOString() })
      .eq('id', this.id);

    if (error) {
      logger.error(`Error updating last match attempt: ${error.message}`);
    }
  }

  async updateMinAcceptableScore(daysSinceLastAttempt) {
    const newScore = degradeStandards(this, daysSinceLastAttempt);

    if (newScore < this.min_acceptable_score) {
      const { error } = await this.supabase
        .from('garments')
        .update({ min_acceptable_score: newScore })
        .eq('id', this.id);

      if (error) {
        logger.error(`Error updating min acceptable score: ${error.message}`);
      } else {
        this.min_acceptable_score = newScore;
        logger.info(`${this.name} lowered standards to ${(newScore * 100).toFixed(0)}% after ${daysSinceLastAttempt} days`);
      }
    }
  }

  getDaysSinceLastAttempt() {
    if (!this.last_match_attempt) return 0;

    const now = new Date();
    const lastAttempt = new Date(this.last_match_attempt);
    const diffMs = now - lastAttempt;
    return Math.floor(diffMs / (1000 * 60 * 60 * 24));
  }

  toJSON() {
    return {
      id: this.id,
      name: this.name,
      category: this.category,
      size: this.size,
      style_tags: this.style_tags,
      personality: this.personality,
      vibe: this.vibe,
      condition: this.condition,
      rarity: this.rarity,
      patience: this.patience,
      min_acceptable_score: this.min_acceptable_score,
      owner_id: this.owner_id,
      active: this.active,
      image_url: this.image_url
    };
  }
}

module.exports = GarmentAgent;

const GarmentAgent = require('./ClothingAgent');
const { generateDialogue } = require('../voice/dialogue');
const { generateDialogueAudio } = require('../voice/elevenlabs');
const logger = require('../utils/logger');
const weights = require('../config/weights.json');

class AgentOrchestrator {
  constructor(supabaseClient, llmClient, options = {}) {
    this.supabase = supabaseClient;
    this.llmClient = llmClient;
    this.weights = weights;
    this.isRunning = false;
    this.tickInterval = options.tickInterval || 30000;
    this.intervalId = null;
  }

  async start() {
    if (this.isRunning) {
      logger.warn('Orchestrator already running');
      return;
    }

    this.isRunning = true;
    logger.info('Starting agent orchestrator...');

    await this.tick();

    this.intervalId = setInterval(async () => {
      await this.tick();
    }, this.tickInterval);

    logger.info(`Orchestrator started with ${this.tickInterval}ms tick interval`);
  }

  stop() {
    if (!this.isRunning) {
      return;
    }

    this.isRunning = false;
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }

    logger.info('Orchestrator stopped');
  }

  async tick() {
    try {
      logger.info('Orchestrator tick started');

      const garments = await this.loadActiveGarments();

      if (garments.length < 2) {
        logger.info('Not enough active garments for matching');
        return;
      }

      const agents = garments.map(g => new GarmentAgent(g, this.supabase, this.weights));

      logger.info(`Loaded ${agents.length} garment agents`);

      for (const agent of agents) {
        await agent.tick(garments);
      }

      await this.processPendingIntents(agents, garments);

      await this.processAcceptedIntents();

      logger.info('Orchestrator tick completed');

    } catch (error) {
      logger.error(`Error in orchestrator tick: ${error.message}`);
    }
  }

  async loadActiveGarments() {
    const { data, error } = await this.supabase
      .from('garments')
      .select('*')
      .eq('active', true);

    if (error) {
      logger.error(`Error loading garments: ${error.message}`);
      return [];
    }

    return data || [];
  }

  async processPendingIntents(agents, garments) {
    const { data: pendingIntents, error } = await this.supabase
      .from('swap_intents')
      .select('*')
      .eq('status', 'PENDING');

    if (error) {
      logger.error(`Error loading pending intents: ${error.message}`);
      return;
    }

    if (!pendingIntents || pendingIntents.length === 0) {
      return;
    }

    logger.info(`Processing ${pendingIntents.length} pending swap intents`);

    for (const intent of pendingIntents) {
      const targetAgent = agents.find(a => a.id === intent.garment_b_id);
      const proposingGarment = garments.find(g => g.id === intent.garment_a_id);

      if (targetAgent && proposingGarment) {
        await targetAgent.handleProposal(intent, proposingGarment);
      }
    }
  }

  async processAcceptedIntents() {
    const { data: acceptedIntents, error } = await this.supabase
      .from('swap_intents')
      .select('*')
      .eq('status', 'ACCEPTED')
      .is('dialogue_text', null);

    if (error) {
      logger.error(`Error loading accepted intents: ${error.message}`);
      return;
    }

    if (!acceptedIntents || acceptedIntents.length === 0) {
      return;
    }

    logger.info(`Processing ${acceptedIntents.length} accepted swap intents`);

    for (const intent of acceptedIntents) {
      await this.generateDialogueForIntent(intent);
    }
  }

  async generateDialogueForIntent(intent) {
    try {
      const garmentA = await this.loadGarment(intent.garment_a_id);
      const garmentB = await this.loadGarment(intent.garment_b_id);

      if (!garmentA || !garmentB) {
        logger.error(`Could not load garments for intent ${intent.id}`);
        return;
      }

      const compatibility = {
        total: intent.compatibility_score,
        fairness: intent.fairness_score
      };

      const dialogue = await generateDialogue(garmentA, garmentB, compatibility, this.llmClient);

      await this.supabase
        .from('swap_intents')
        .update({
          dialogue_text: dialogue
        })
        .eq('id', intent.id);

      logger.info(`Generated dialogue for swap intent ${intent.id}`);

      if (process.env.ELEVENLABS_API_KEY) {
        await this.generateAudioForIntent(intent.id, dialogue, garmentA, garmentB);
      }

    } catch (error) {
      logger.error(`Error generating dialogue for intent: ${error.message}`);
    }
  }

  async generateAudioForIntent(intentId, dialogue, garmentA, garmentB) {
    try {
      const audio = await generateDialogueAudio(dialogue, garmentA, garmentB);

      if (audio) {
        logger.info(`Generated audio for swap intent ${intentId}`);
      }

    } catch (error) {
      logger.error(`Error generating audio: ${error.message}`);
    }
  }

  async loadGarment(garmentId) {
    const { data, error } = await this.supabase
      .from('garments')
      .select('*')
      .eq('id', garmentId)
      .maybeSingle();

    if (error) {
      logger.error(`Error loading garment ${garmentId}: ${error.message}`);
      return null;
    }

    return data;
  }

  async confirmSwap(intentId, blockchainTxId = null) {
    try {
      const { data: intent, error: intentError } = await this.supabase
        .from('swap_intents')
        .select('*')
        .eq('id', intentId)
        .maybeSingle();

      if (intentError || !intent) {
        logger.error(`Could not load intent ${intentId}`);
        return { success: false, error: 'Intent not found' };
      }

      const garmentA = await this.loadGarment(intent.garment_a_id);
      const garmentB = await this.loadGarment(intent.garment_b_id);

      if (!garmentA || !garmentB) {
        return { success: false, error: 'Garments not found' };
      }

      await this.supabase
        .from('swap_intents')
        .update({
          status: 'CONFIRMED',
          confirmed_at: new Date().toISOString(),
          blockchain_tx_id: blockchainTxId
        })
        .eq('id', intentId);

      await this.supabase
        .from('swap_history')
        .insert({
          swap_intent_id: intentId,
          garment_a_id: intent.garment_a_id,
          garment_b_id: intent.garment_b_id,
          garment_a_data: garmentA,
          garment_b_data: garmentB,
          owner_a_id: intent.owner_a_id,
          owner_b_id: intent.owner_b_id,
          compatibility_score: intent.compatibility_score,
          fairness_score: intent.fairness_score,
          blockchain_tx_id: blockchainTxId,
          completed_at: new Date().toISOString()
        });

      await this.supabase
        .from('garments')
        .update({ owner_id: intent.owner_b_id })
        .eq('id', intent.garment_a_id);

      await this.supabase
        .from('garments')
        .update({ owner_id: intent.owner_a_id })
        .eq('id', intent.garment_b_id);

      logger.info(`Confirmed swap ${intentId} and updated ownership`);

      return { success: true, intent };

    } catch (error) {
      logger.error(`Error confirming swap: ${error.message}`);
      return { success: false, error: error.message };
    }
  }
}

module.exports = AgentOrchestrator;

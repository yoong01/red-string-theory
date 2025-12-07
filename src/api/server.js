const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');
const AgentOrchestrator = require('../agents/orchestrator');
const logger = require('../utils/logger');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

const llmClient = {
  chat: async ({ messages, temperature, max_tokens }) => {
    return messages[0].content;
  }
};

const orchestrator = new AgentOrchestrator(supabase, llmClient, {
  tickInterval: 60000
});

orchestrator.start();

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', orchestrator: orchestrator.isRunning });
});

app.get('/api/garments', async (req, res) => {
  try {
    const { ownerId, active } = req.query;

    let query = supabase.from('garments').select('*');

    if (ownerId) {
      query = query.eq('owner_id', ownerId);
    }

    if (active !== undefined) {
      query = query.eq('active', active === 'true');
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    res.json(data);

  } catch (error) {
    logger.error(`Error fetching garments: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/garments/:id', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('garments')
      .select('*')
      .eq('id', req.params.id)
      .maybeSingle();

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    if (!data) {
      return res.status(404).json({ error: 'Garment not found' });
    }

    res.json(data);

  } catch (error) {
    logger.error(`Error fetching garment: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/garments', async (req, res) => {
  try {
    const garmentData = req.body;

    const { data, error } = await supabase
      .from('garments')
      .insert(garmentData)
      .select()
      .maybeSingle();

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    logger.info(`Created garment: ${data.name}`);
    res.status(201).json(data);

  } catch (error) {
    logger.error(`Error creating garment: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/garments/:id', async (req, res) => {
  try {
    const updates = req.body;

    const { data, error } = await supabase
      .from('garments')
      .update(updates)
      .eq('id', req.params.id)
      .select()
      .maybeSingle();

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    res.json(data);

  } catch (error) {
    logger.error(`Error updating garment: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/garments/:id', async (req, res) => {
  try {
    const { error } = await supabase
      .from('garments')
      .delete()
      .eq('id', req.params.id);

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    res.json({ success: true });

  } catch (error) {
    logger.error(`Error deleting garment: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/swap-intents', async (req, res) => {
  try {
    const { ownerId, status } = req.query;

    let query = supabase
      .from('swap_intents')
      .select(`
        *,
        garment_a:garments!swap_intents_garment_a_id_fkey(*),
        garment_b:garments!swap_intents_garment_b_id_fkey(*)
      `);

    if (ownerId) {
      query = query.or(`owner_a_id.eq.${ownerId},owner_b_id.eq.${ownerId}`);
    }

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query.order('proposed_at', { ascending: false });

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    res.json(data);

  } catch (error) {
    logger.error(`Error fetching swap intents: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/swap-intents/:id', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('swap_intents')
      .select(`
        *,
        garment_a:garments!swap_intents_garment_a_id_fkey(*),
        garment_b:garments!swap_intents_garment_b_id_fkey(*)
      `)
      .eq('id', req.params.id)
      .maybeSingle();

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    if (!data) {
      return res.status(404).json({ error: 'Swap intent not found' });
    }

    res.json(data);

  } catch (error) {
    logger.error(`Error fetching swap intent: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/swap-intents/:id/confirm', async (req, res) => {
  try {
    const { blockchainTxId } = req.body;

    const result = await orchestrator.confirmSwap(req.params.id, blockchainTxId);

    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }

    res.json(result.intent);

  } catch (error) {
    logger.error(`Error confirming swap: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/swap-intents/:id/decline', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('swap_intents')
      .update({
        status: 'DECLINED',
        responded_at: new Date().toISOString()
      })
      .eq('id', req.params.id)
      .select()
      .maybeSingle();

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    res.json(data);

  } catch (error) {
    logger.error(`Error declining swap: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/swap-history', async (req, res) => {
  try {
    const { ownerId } = req.query;

    let query = supabase
      .from('swap_history')
      .select('*');

    if (ownerId) {
      query = query.or(`owner_a_id.eq.${ownerId},owner_b_id.eq.${ownerId}`);
    }

    const { data, error } = await query.order('completed_at', { ascending: false });

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    res.json(data);

  } catch (error) {
    logger.error(`Error fetching swap history: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/users/:id', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', req.params.id)
      .maybeSingle();

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    if (!data) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(data);

  } catch (error) {
    logger.error(`Error fetching user: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/users', async (req, res) => {
  try {
    const userData = req.body;

    const { data, error } = await supabase
      .from('users')
      .insert(userData)
      .select()
      .maybeSingle();

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    res.status(201).json(data);

  } catch (error) {
    logger.error(`Error creating user: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/orchestrator/trigger', async (req, res) => {
  try {
    await orchestrator.tick();
    res.json({ success: true, message: 'Orchestrator tick triggered' });

  } catch (error) {
    logger.error(`Error triggering orchestrator: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
});

process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  orchestrator.stop();
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  orchestrator.stop();
  process.exit(0);
});

app.listen(PORT, () => {
  logger.info(`API server running on port ${PORT}`);
});

module.exports = app;

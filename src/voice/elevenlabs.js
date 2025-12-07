const axios = require('axios');
const logger = require('../utils/logger');

const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;
const ELEVENLABS_API_URL = 'https://api.elevenlabs.io/v1';

const VOICE_PROFILES = {
  bold: {
    voice_id: '21m00Tcm4TlvDq8ikWAM',
    name: 'Rachel',
    description: 'Confident and assertive'
  },
  refined: {
    voice_id: 'AZnzlk1XvdvUeBnXmlld',
    name: 'Domi',
    description: 'Sophisticated and elegant'
  },
  relaxed: {
    voice_id: 'EXAVITQu4vr4xnSDxMaL',
    name: 'Bella',
    description: 'Calm and easygoing'
  },
  chaotic: {
    voice_id: 'ErXwobaYiN019PkySvjV',
    name: 'Antoni',
    description: 'Energetic and unpredictable'
  },
  understated: {
    voice_id: 'MF3mGyEYCl7XYWbV9V6O',
    name: 'Elli',
    description: 'Subtle and minimalist'
  },
  default: {
    voice_id: '21m00Tcm4TlvDq8ikWAM',
    name: 'Rachel',
    description: 'Default voice'
  }
};

function selectVoiceForGarment(garment) {
  if (!garment.personality || garment.personality.length === 0) {
    return VOICE_PROFILES.default;
  }

  const personality = garment.personality[0].toLowerCase();

  return VOICE_PROFILES[personality] || VOICE_PROFILES.default;
}

async function synthesizeSpeech(text, voiceId, stability = 0.5, similarityBoost = 0.75) {
  if (!ELEVENLABS_API_KEY) {
    logger.warn('ElevenLabs API key not configured, skipping voice synthesis');
    return null;
  }

  try {
    const response = await axios.post(
      `${ELEVENLABS_API_URL}/text-to-speech/${voiceId}`,
      {
        text,
        model_id: 'eleven_monolingual_v1',
        voice_settings: {
          stability,
          similarity_boost: similarityBoost
        }
      },
      {
        headers: {
          'Accept': 'audio/mpeg',
          'Content-Type': 'application/json',
          'xi-api-key': ELEVENLABS_API_KEY
        },
        responseType: 'arraybuffer'
      }
    );

    return Buffer.from(response.data);

  } catch (error) {
    logger.error(`ElevenLabs API error: ${error.message}`);
    if (error.response) {
      logger.error(`Status: ${error.response.status}, Data: ${error.response.data}`);
    }
    return null;
  }
}

async function generateDialogueAudio(dialogue, garmentA, garmentB) {
  const voiceA = selectVoiceForGarment(garmentA);
  const voiceB = selectVoiceForGarment(garmentB);

  logger.info(`Generating audio for ${garmentA.name} (${voiceA.name}) and ${garmentB.name} (${voiceB.name})`);

  const audioA = await synthesizeSpeech(dialogue.garmentA.text, voiceA.voice_id);
  const audioB = await synthesizeSpeech(dialogue.garmentB.text, voiceB.voice_id);

  if (!audioA || !audioB) {
    return null;
  }

  return {
    garmentA: {
      name: garmentA.name,
      audio: audioA,
      voice: voiceA.name,
      text: dialogue.garmentA.text
    },
    garmentB: {
      name: garmentB.name,
      audio: audioB,
      voice: voiceB.name,
      text: dialogue.garmentB.text
    }
  };
}

async function getAvailableVoices() {
  if (!ELEVENLABS_API_KEY) {
    return null;
  }

  try {
    const response = await axios.get(`${ELEVENLABS_API_URL}/voices`, {
      headers: {
        'xi-api-key': ELEVENLABS_API_KEY
      }
    });

    return response.data.voices;

  } catch (error) {
    logger.error(`Error fetching voices: ${error.message}`);
    return null;
  }
}

module.exports = {
  synthesizeSpeech,
  generateDialogueAudio,
  selectVoiceForGarment,
  getAvailableVoices,
  VOICE_PROFILES
};

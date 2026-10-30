import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { 
  connectToTwitchChannel, 
  disconnectTwitch, 
  startSimulator, 
  stopSimulator, 
  getStatus,
  runAnalysisPass
} from '../services/twitchService.js';
import { Session } from '../models/Session.js';

const router = express.Router();
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.resolve(__dirname, '../../.env');

router.get('/status', (req, res) => {
  res.json(getStatus());
});

router.post('/channel/connect', async (req, res) => {
  const { channel } = req.body;
  if (!channel) return res.status(400).json({ error: 'Channel name is required' });

  try {
    const result = await connectToTwitchChannel(channel);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/channel/disconnect', async (req, res) => {
  await disconnectTwitch();
  res.json({ status: 'disconnected' });
});

router.post('/simulator/start', async (req, res) => {
  const { channel } = req.body;
  const result = await startSimulator(channel || 'grvd_live');
  res.json(result);
});

router.post('/simulator/stop', async (req, res) => {
  await stopSimulator();
  res.json({ status: 'simulator_stopped' });
});

router.post('/analyze-now', async (req, res) => {
  try {
    const result = await runAnalysisPass();
    res.json({ success: true, result });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/sessions', async (req, res) => {
  try {
    const sessions = await Session.find().sort({ createdAt: -1 }).limit(10);
    res.json(sessions);
  } catch (err) {
    res.json([]);
  }
});

router.post('/config/keys', async (req, res) => {
  try {
    const { openaiKey, geminiKey } = req.body;
    
    // Update active memory
    if (openaiKey) process.env.OPENAI_API_KEY = openaiKey;
    if (geminiKey) process.env.GEMINI_API_KEY = geminiKey;

    // Persist to .env file so keys survive restarts
    let envContent = '';
    if (fs.existsSync(envPath)) {
      envContent = fs.readFileSync(envPath, 'utf8');
    }

    if (geminiKey) {
      if (envContent.includes('GEMINI_API_KEY=')) {
        envContent = envContent.replace(/GEMINI_API_KEY=.*/g, `GEMINI_API_KEY=${geminiKey}`);
      } else {
        envContent += `\nGEMINI_API_KEY=${geminiKey}`;
      }
    }

    if (openaiKey) {
      if (envContent.includes('OPENAI_API_KEY=')) {
        envContent = envContent.replace(/OPENAI_API_KEY=.*/g, `OPENAI_API_KEY=${openaiKey}`);
      } else {
        envContent += `\nOPENAI_API_KEY=${openaiKey}`;
      }
    }

    fs.writeFileSync(envPath, envContent.trim() + '\n', 'utf8');
    console.log('💾 Successfully persisted API keys to .env');

    res.json({
      success: true,
      hasOpenAI: !!process.env.OPENAI_API_KEY,
      hasGemini: !!process.env.GEMINI_API_KEY
    });
  } catch (err) {
    console.error('Failed to write .env file:', err.message);
    res.status(500).json({ error: 'Failed to persist keys to disk' });
  }
});

export default router;

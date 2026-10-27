import express from 'express';
import { connectToTwitchChannel, disconnectTwitch, startSimulator, stopSimulator, getStatus } from '../services/twitchService.js';
import { Session } from '../models/Session.js';

const router = express.Router();

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

router.post('/simulator/start', (req, res) => {
  const { channel } = req.body;
  const result = startSimulator(channel || 'demo_stream');
  res.json(result);
});

router.post('/simulator/stop', (req, res) => {
  stopSimulator();
  res.json({ status: 'simulator_stopped' });
});

router.get('/sessions', async (req, res) => {
  try {
    const sessions = await Session.find().sort({ createdAt: -1 }).limit(10);
    res.json(sessions);
  } catch (err) {
    res.json([]);
  }
});

router.post('/config/keys', (req, res) => {
  const { openaiKey, geminiKey } = req.body;
  if (openaiKey) process.env.OPENAI_API_KEY = openaiKey;
  if (geminiKey) process.env.GEMINI_API_KEY = geminiKey;
  res.json({
    hasOpenAI: !!process.env.OPENAI_API_KEY,
    hasGemini: !!process.env.GEMINI_API_KEY
  });
});

export default router;

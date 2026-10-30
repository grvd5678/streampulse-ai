import tmi from 'tmi.js';
import { analyzeChatBatch } from './aiService.js';
import { broadcastToDashboard, broadcastToOverlay, broadcastToAll } from './socketService.js';
import { Session } from '../models/Session.js';

let tmiClient = null;
let currentChannel = null;
let messageBuffer = [];
let recentMessageTimestamps = [];
let intervalTimer = null;
let simulatorTimer = null;
let currentSessionDoc = null;
let isSimulatorActive = false;

const BATCH_INTERVAL_MS = 15000; // 15-second cadence (fast & responsive for live demos)

function emitTwitchStatus() {
  const status = getStatus();
  broadcastToAll('twitch_status', status);
}

/**
 * Connect to a Twitch Channel Chat
 */
export async function connectToTwitchChannel(channelName) {
  if (!channelName) throw new Error('Channel name required');
  const normalizedChannel = channelName.toLowerCase().replace('#', '').trim();

  // If already connected to this channel, return
  if (currentChannel === normalizedChannel && tmiClient && !isSimulatorActive) {
    return { status: 'already_connected', channel: currentChannel };
  }

  // Await full cleanup of existing client / simulator
  await disconnectTwitch();

  currentChannel = normalizedChannel;
  isSimulatorActive = false;
  messageBuffer = [];
  recentMessageTimestamps = [];

  tmiClient = new tmi.Client({
    options: { debug: false },
    channels: [normalizedChannel]
  });

  tmiClient.on('message', (channel, tags, message, self) => {
    if (self) return;

    const chatItem = {
      id: tags.id || `${Date.now()}-${Math.random()}`,
      user: tags['display-name'] || tags.username || 'Anonymous',
      color: tags.color || '#9146FF',
      badges: tags.badges || {},
      message: message,
      timestamp: new Date()
    };

    messageBuffer.push(chatItem);
    recentMessageTimestamps.push(Date.now());
    broadcastToDashboard('raw_chat_message', chatItem);
  });

  try {
    await tmiClient.connect();
    console.log(`🔌 Connected to Twitch chat: #${normalizedChannel}`);

    try {
      currentSessionDoc = await Session.create({
        channel: normalizedChannel,
        status: 'active'
      });
    } catch {
      currentSessionDoc = { _id: Date.now(), channel: normalizedChannel };
    }

    startAnalysisCycle();
    emitTwitchStatus();

    return { status: 'connected', channel: normalizedChannel };
  } catch (err) {
    console.error(`Failed to connect to Twitch #${normalizedChannel}:`, err.message);
    // FULL CLEANUP on failure so it never misreports as connected
    if (tmiClient) {
      try { await tmiClient.disconnect(); } catch (e) {}
      tmiClient = null;
    }
    currentChannel = null;
    isSimulatorActive = false;
    emitTwitchStatus();
    throw err;
  }
}

/**
 * Disconnect from Twitch and stop simulator
 */
export async function disconnectTwitch() {
  if (intervalTimer) {
    clearInterval(intervalTimer);
    intervalTimer = null;
  }
  stopSimulatorInternal();

  if (tmiClient) {
    try {
      await tmiClient.disconnect();
    } catch (e) {
      // Ignore disconnect errors
    }
    tmiClient = null;
  }
  currentChannel = null;
  isSimulatorActive = false;
  messageBuffer = [];
  emitTwitchStatus();
}

/**
 * Runs one batch intelligence pass (Guaranteed to return an analysis payload)
 */
export async function runAnalysisPass() {
  const channel = currentChannel || 'grvd_live';
  const messagesToProcess = [...messageBuffer];
  messageBuffer = []; // reset buffer for next cycle

  const now = Date.now();
  recentMessageTimestamps = recentMessageTimestamps.filter(t => now - t < 60000);
  const msgsPerMinute = recentMessageTimestamps.length;
  const msgsPerSecond = Number((msgsPerMinute / 60).toFixed(1));

  broadcastToDashboard('velocity_update', {
    msgsPerMinute,
    msgsPerSecond,
    bufferSize: messagesToProcess.length
  });

  try {
    console.log(`🧠 Running AI analysis on ${messagesToProcess.length} messages for #${channel}...`);
    const analysis = await analyzeChatBatch(messagesToProcess, channel);

    const payload = {
      id: `${Date.now()}-${Math.random()}`,
      timestamp: new Date(),
      channel: channel,
      messageCount: messagesToProcess.length,
      ...analysis
    };

    broadcastToDashboard('ai_summary_update', payload);

    broadcastToOverlay('overlay_vibe_update', {
      sentiment: analysis.sentiment
    });

    if (currentSessionDoc && currentSessionDoc.summaries) {
      currentSessionDoc.summaries.push({
        bullets: analysis.bullets,
        sentiment: analysis.sentiment,
        alerts: analysis.alerts
      });
      currentSessionDoc.totalMessages += messagesToProcess.length;
      currentSessionDoc.peakVelocity = Math.max(currentSessionDoc.peakVelocity || 0, msgsPerSecond);
      currentSessionDoc.save?.().catch(() => {});
    }

    return payload;
  } catch (err) {
    console.error('Error during batch analysis cycle:', err.message);
    const fallbackPayload = {
      id: `${Date.now()}-${Math.random()}`,
      timestamp: new Date(),
      channel: channel,
      messageCount: messagesToProcess.length,
      bullets: ['Chat is moving steadily.', 'Audience engagement is steady.'],
      questions: [],
      sentiment: { score: 0.0, label: 'Neutral' },
      alerts: []
    };
    broadcastToDashboard('ai_summary_update', fallbackPayload);
    return fallbackPayload;
  }
}

function startAnalysisCycle() {
  if (intervalTimer) clearInterval(intervalTimer);
  intervalTimer = setInterval(runAnalysisPass, BATCH_INTERVAL_MS);
}

/**
 * Realistic Twitch Chat Simulator (Async and race-free)
 */
export async function startSimulator(channelName = 'grvd_live') {
  // AWAIT the disconnect to prevent race conditions
  await disconnectTwitch();

  currentChannel = channelName;
  isSimulatorActive = true;
  console.log('🎮 Simulator started for streamer channel:', channelName);

  const sampleUsers = ['KittenSlayer99', 'PixelKnight', 'CodeNinja', 'CyberValkyrie', 'GamerGuy_24', 'CoffeeCoder', 'ShadowStrike', 'Nova_x'];
  const sampleMessages = [
    'LETS GOOOOOO!! W game',
    'What mouse sensitivity do you play on?',
    'Bro that flick was unbelievable LMAO',
    'KEKW KEKW KEKW',
    'Are you going to TwitchCon this year?',
    'Is your game audio a little quiet or is it just me?',
    'Wait, check your inventory, you missed the legendary chest!',
    'Can you explain why you built that item first?',
    'PogChamp PogChamp',
    'What rank are you currently aiming for this season?',
    'HYPE HYPE HYPE',
    'Can you show your controller keybinds?'
  ];

  startAnalysisCycle();

  simulatorTimer = setInterval(() => {
    const randomUser = sampleUsers[Math.floor(Math.random() * sampleUsers.length)];
    const randomMsg = sampleMessages[Math.floor(Math.random() * sampleMessages.length)];

    const chatItem = {
      id: `${Date.now()}-${Math.random()}`,
      user: randomUser,
      color: '#9146FF',
      badges: { subscriber: '1' },
      message: randomMsg,
      timestamp: new Date()
    };

    messageBuffer.push(chatItem);
    recentMessageTimestamps.push(Date.now());
    broadcastToDashboard('raw_chat_message', chatItem);
  }, 1000);

  emitTwitchStatus();
  return { status: 'simulator_running', channel: channelName };
}

function stopSimulatorInternal() {
  if (simulatorTimer) {
    clearInterval(simulatorTimer);
    simulatorTimer = null;
  }
  isSimulatorActive = false;
}

export async function stopSimulator() {
  stopSimulatorInternal();
  await disconnectTwitch();
}

export function getStatus() {
  const now = Date.now();
  recentMessageTimestamps = recentMessageTimestamps.filter(t => now - t < 60000);
  return {
    channel: currentChannel,
    isTwitchConnected: !!tmiClient && !isSimulatorActive,
    isSimulator: isSimulatorActive,
    bufferedMessages: messageBuffer.length,
    velocity: {
      msgsPerMinute: recentMessageTimestamps.length,
      msgsPerSecond: Number((recentMessageTimestamps.length / 60).toFixed(1))
    }
  };
}

import tmi from 'tmi.js';
import { analyzeChatBatch } from './aiService.js';
import { broadcastToDashboard, broadcastToOverlay } from './socketService.js';
import { Session } from '../models/Session.js';

let tmiClient = null;
let currentChannel = null;
let messageBuffer = [];
let recentMessageTimestamps = [];
let intervalTimer = null;
let simulatorTimer = null;
let currentSessionDoc = null;

const BATCH_INTERVAL_MS = 25000; // Run AI analysis every 25 seconds

/**
 * Connect to a Twitch Channel Chat
 */
export async function connectToTwitchChannel(channelName) {
  if (!channelName) throw new Error('Channel name required');
  const normalizedChannel = channelName.toLowerCase().replace('#', '').trim();

  // If already connected to this channel, return
  if (currentChannel === normalizedChannel && tmiClient) {
    return { status: 'already_connected', channel: currentChannel };
  }

  // Disconnect existing client if connected
  await disconnectTwitch();

  currentChannel = normalizedChannel;
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

    // Add to buffer
    messageBuffer.push(chatItem);
    recentMessageTimestamps.push(Date.now());

    // Broadcast live chat item to dashboard
    broadcastToDashboard('raw_chat_message', chatItem);
  });

  try {
    await tmiClient.connect();
    console.log(`🔌 Connected to Twitch chat: #${normalizedChannel}`);

    // Try to create session in MongoDB if available
    try {
      currentSessionDoc = await Session.create({
        channel: normalizedChannel,
        status: 'active'
      });
    } catch {
      currentSessionDoc = { _id: Date.now(), channel: normalizedChannel };
    }

    // Start 25-second AI digestion cycle
    startAnalysisCycle();

    return { status: 'connected', channel: normalizedChannel };
  } catch (err) {
    console.error(`Failed to connect to Twitch #${normalizedChannel}:`, err.message);
    throw err;
  }
}

/**
 * Disconnect from Twitch
 */
export async function disconnectTwitch() {
  if (intervalTimer) {
    clearInterval(intervalTimer);
    intervalTimer = null;
  }
  stopSimulator();

  if (tmiClient) {
    try {
      await tmiClient.disconnect();
    } catch (e) {
      // Ignore disconnect errors
    }
    tmiClient = null;
  }
  currentChannel = null;
  messageBuffer = [];
}

/**
 * Starts the periodic batch intelligence pipeline
 */
function startAnalysisCycle() {
  if (intervalTimer) clearInterval(intervalTimer);

  intervalTimer = setInterval(async () => {
    if (!currentChannel) return;

    const messagesToProcess = [...messageBuffer];
    messageBuffer = []; // reset buffer for next window

    // Calculate velocity (messages in last 60 seconds)
    const now = Date.now();
    recentMessageTimestamps = recentMessageTimestamps.filter(t => now - t < 60000);
    const msgsPerMinute = recentMessageTimestamps.length;
    const msgsPerSecond = Number((msgsPerMinute / 60).toFixed(1));

    // Send velocity update
    broadcastToDashboard('velocity_update', {
      msgsPerMinute,
      msgsPerSecond,
      bufferSize: messagesToProcess.length
    });

    if (messagesToProcess.length === 0) return;

    try {
      console.log(`🧠 Running AI analysis on ${messagesToProcess.length} messages for #${currentChannel}...`);
      const analysis = await analyzeChatBatch(messagesToProcess, currentChannel);

      const payload = {
        timestamp: new Date(),
        channel: currentChannel,
        messageCount: messagesToProcess.length,
        ...analysis
      };

      // Broadcast to Streamer Dashboard
      broadcastToDashboard('ai_summary_update', payload);

      // Broadcast vibe to on-stream OBS Overlay
      broadcastToOverlay('overlay_vibe_update', {
        sentiment: analysis.sentiment
      });

      // Save to database if connected
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
    } catch (err) {
      console.error('Error during batch analysis cycle:', err.message);
    }
  }, BATCH_INTERVAL_MS);
}

/**
 * Realistic Twitch Chat Simulator (for testing without a live stream)
 */
export function startSimulator(channelName = 'demo_stream') {
  disconnectTwitch();
  currentChannel = channelName;
  console.log('🎮 Simulator started for channel:', channelName);

  const sampleUsers = ['KittenSlayer99', 'PixelKnight', 'CodeNinja', 'CyberValkyrie', 'GamerGuy_24', 'CoffeeCoder', 'ShadowStrike', 'Nova_x'];
  const sampleMessages = [
    'LETS GOOOOOO!! W',
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
    'Check your discord, mods sent an update'
  ];

  startAnalysisCycle();

  simulatorTimer = setInterval(() => {
    const randomUser = sampleUsers[Math.floor(Math.random() * sampleUsers.length)];
    const randomMsg = sampleMessages[Math.floor(Math.random() * sampleMessages.length)];

    const chatItem = {
      id: `${Date.now()}-${Math.random()}`,
      user: randomUser,
      color: '#9146FF',
      badges: { broadcaster: '1' },
      message: randomMsg,
      timestamp: new Date()
    };

    messageBuffer.push(chatItem);
    recentMessageTimestamps.push(Date.now());
    broadcastToDashboard('raw_chat_message', chatItem);
  }, 1200);

  return { status: 'simulator_running', channel: channelName };
}

export function stopSimulator() {
  if (simulatorTimer) {
    clearInterval(simulatorTimer);
    simulatorTimer = null;
    console.log('🛑 Simulator stopped.');
  }
}

export function getStatus() {
  const now = Date.now();
  recentMessageTimestamps = recentMessageTimestamps.filter(t => now - t < 60000);
  return {
    channel: currentChannel,
    isConnected: !!tmiClient || !!simulatorTimer,
    isSimulator: !!simulatorTimer,
    bufferedMessages: messageBuffer.length,
    velocity: {
      msgsPerMinute: recentMessageTimestamps.length,
      msgsPerSecond: Number((recentMessageTimestamps.length / 60).toFixed(1))
    }
  };
}

import { GoogleGenerativeAI } from '@google/generative-ai';
import OpenAI from 'openai';

let openaiClient = null;
let geminiClient = null;

const getOpenAIClient = () => {
  if (!openaiClient && process.env.OPENAI_API_KEY) {
    openaiClient = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  return openaiClient;
};

const getGeminiClient = () => {
  if (!geminiClient && process.env.GEMINI_API_KEY) {
    geminiClient = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  }
  return geminiClient;
};

/**
 * Analyzes a batch of chat messages and returns structured intelligence:
 * - 3 summary bullet points
 * - extracted viewer questions
 * - sentiment & vibe score (-1.0 to +1.0)
 * - technical or gameplay alerts
 */
export async function analyzeChatBatch(messages, channelName = 'general') {
  if (!messages || messages.length === 0) {
    return {
      bullets: ['Chat is quiet. Waiting for incoming activity...'],
      questions: [],
      sentiment: { score: 0.0, label: 'Neutral' },
      alerts: []
    };
  }

  const chatText = messages
    .map(m => `[${m.user}]: ${m.message}`)
    .join('\n');

  const systemPrompt = `You are StreamPulse AI, a real-time stream intelligence co-pilot for Twitch streamer "${channelName}".
Your job is to parse incoming live chat logs and extract high-value insights for the streamer.

Analyze the provided chat batch and return ONLY a valid JSON object matching this schema:
{
  "bullets": [
    "Short 1-sentence bullet on what chat is discussing or reacting to",
    "Short 1-sentence bullet on community sentiment / memes",
    "Short 1-sentence bullet on any tips, suggestions, or game reactions"
  ],
  "questions": [
    {
      "user": "username of the first asker",
      "question": "Canonical, concise version of the audience's question",
      "category": "Gameplay | Hardware | Personal | General",
      "repeatCount": 1,
      "askers": ["username"]
    }
  ],
  "sentiment": {
    "score": 0.85, // number from -1.0 (toxic/angry) to 1.0 (hyped/celebrating)
    "label": "Hyped | Laughing | Focused | Confused | Toxic"
  },
  "alerts": [
    // e.g. "Audio is muted!", "Lag detected in game!", or empty array if none
  ]
}
Be concise, accurate, and filter out spam or low-effort emote spam. Consolidate questions that ask for the same thing even when phrased differently (for example, "what sens do you use?" and "what's your mouse sensitivity?"). Return one canonical question for that intent, set repeatCount to the number of distinct chat messages, and include the usernames in askers. Do not merge questions that share a topic but ask for different information. For a single question, repeatCount is 1.`;

  // 1. Try Gemini if configured
  if (process.env.GEMINI_API_KEY) {
    try {
      const genAI = getGeminiClient();
      const model = genAI.getGenerativeModel({
        model: 'gemini-1.5-flash',
        generationConfig: {
          responseMimeType: 'application/json'
        }
      });
      const result = await model.generateContent(
        `${systemPrompt}\n\nIncoming Chat Log (${messages.length} messages):\n${chatText}`
      );

      const text = result.response.text();
      return sanitizeAnalysis(JSON.parse(text), messages);
    } catch (err) {
      console.warn('Gemini analysis failed, falling back to OpenAI or simulator:', err.message);
    }
  }

  // 2. Try OpenAI if configured
  if (process.env.OPENAI_API_KEY) {
    try {
      const openai = getOpenAIClient();
      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Incoming Chat Log (${messages.length} messages):\n${chatText}` }
        ],
        response_format: { type: 'json_object' }
      });

      return sanitizeAnalysis(JSON.parse(completion.choices[0].message.content), messages);
    } catch (err) {
      console.warn('OpenAI analysis failed, falling back to simulator:', err.message);
    }
  }

  // 3. Fallback: Intelligent Local Parser (Simulator / offline mode)
  return sanitizeAnalysis(generateLocalAnalysis(messages), messages);
}

function sanitizeAnalysis(data, fallbackMessages) {
  if (!data || typeof data !== 'object') {
    return generateLocalAnalysis(fallbackMessages);
  }

  const bullets = Array.isArray(data.bullets) && data.bullets.length > 0
    ? data.bullets.map(b => String(b).trim())
    : ['Audience is actively chatting in the channel.', 'Chat engagement is steady.'];

  const questions = Array.isArray(data.questions)
    ? data.questions
        .filter(q => q && typeof q === 'object' && q.question)
        .map(q => ({
          user: String(q.user || 'Viewer').trim(),
          question: String(q.question).trim(),
          category: String(q.category || 'General').trim(),
          repeatCount: typeof q.repeatCount === 'number' && q.repeatCount > 1 ? q.repeatCount : 1,
          askers: Array.isArray(q.askers) && q.askers.length > 0 ? q.askers.map(String) : [String(q.user || 'Viewer')]
        }))
    : [];

  const sentimentObj = data.sentiment && typeof data.sentiment === 'object' ? data.sentiment : {};
  const score = typeof sentimentObj.score === 'number' ? Math.max(-1.0, Math.min(1.0, sentimentObj.score)) : 0.0;
  const label = sentimentObj.label || (score > 0.35 ? 'Hyped' : score < -0.3 ? 'Frustrated' : 'Neutral');

  const alerts = Array.isArray(data.alerts) ? data.alerts.map(a => String(a)) : [];

  return {
    bullets,
    questions,
    sentiment: { score, label },
    alerts
  };
}

function getQuestionTokens(text) {
  return new Set(
    text.toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter(w => w.length > 2 && !['what', 'why', 'how', 'the', 'you', 'your', 'can'].includes(w))
  );
}

function areQuestionsSimilar(q1, q2) {
  const t1 = getQuestionTokens(q1);
  const t2 = getQuestionTokens(q2);
  if (t1.size === 0 || t2.size === 0) return false;

  let intersection = 0;
  for (const word of t1) {
    if (t2.has(word)) intersection++;
  }
  const union = new Set([...t1, ...t2]).size;
  return (intersection / union) >= 0.5; // 50% core keyword match
}

function generateLocalAnalysis(messages) {
  const rawQuestions = [];
  let positiveScore = 0;
  let negativeScore = 0;
  let confusedScore = 0;

  // Strict word boundaries so letters alone never match
  const hypePattern = /\b(w|pog|poggers|hype|gg|clutch|letsgo|insane|love|lol|lmao|kekw|fire|goat)\b/i;
  const confusedPattern = /\b(what|why|how|lost|confused|where|wait|huh)\b/i;
  const negativePattern = /\b(l|throw|bad|lag|mute|muted|scam|unlucky|choke|trash|toxic|cringe)\b/i;

  messages.forEach(m => {
    const text = m.message.trim();
    const lower = text.toLowerCase();

    // Check for questions
    if (text.includes('?') || lower.startsWith('can you') || lower.startsWith('what is') || lower.startsWith('why do') || lower.startsWith('how do')) {
      rawQuestions.push({
        user: m.user,
        question: text,
        category: lower.includes('pc') || lower.includes('spec') || lower.includes('mouse') || lower.includes('sens') 
          ? 'Hardware' 
          : lower.includes('rank') || lower.includes('play') || lower.includes('item') || lower.includes('build') 
          ? 'Gameplay' 
          : 'General'
      });
    }

    if (hypePattern.test(text)) positiveScore += 1;
    if (negativePattern.test(text)) negativeScore += 1;
    if (confusedPattern.test(text)) confusedScore += 1;
  });

  // Accurate keyword-based question clustering (no fragile character slicing!)
  const clusteredQuestions = [];
  rawQuestions.forEach(q => {
    const existing = clusteredQuestions.find(c => areQuestionsSimilar(c.question, q.question));
    if (existing) {
      existing.repeatCount = (existing.repeatCount || 1) + 1;
      if (!existing.askers.includes(q.user)) existing.askers.push(q.user);
    } else {
      clusteredQuestions.push({
        ...q,
        repeatCount: 1,
        askers: [q.user]
      });
    }
  });

  // Accurate sentiment math: net positive vs negative
  const totalSignals = Math.max(1, positiveScore + negativeScore);
  const netScore = Math.min(1.0, Math.max(-1.0, (positiveScore - negativeScore) / totalSignals));

  let label = 'Neutral';
  if (positiveScore > negativeScore && positiveScore >= 2) {
    label = positiveScore > 4 ? 'Hyped' : 'Positive';
  } else if (negativeScore > positiveScore && negativeScore >= 2) {
    label = 'Frustrated';
  } else if (confusedScore >= 3 && positiveScore <= 1) {
    label = 'Confused';
  }

  return {
    bullets: [
      `Chat velocity is active with ${messages.length} messages in this cycle.`,
      `Audience sentiment is currently ${label} with ${positiveScore} hype signals and ${confusedScore} queries.`,
      `Key conversation focus: ${clusteredQuestions.length > 0 ? clusteredQuestions[0].question.slice(0, 50) + '...' : 'Gameplay reactions and live emotes.'}`
    ],
    questions: clusteredQuestions.slice(0, 6),
    sentiment: {
      score: Number(netScore.toFixed(2)),
      label
    },
    alerts: messages.some(m => /\b(mute|muted|no sound|black screen)\b/i.test(m.message)) ? ['Chat reports possible audio or video issue!'] : []
  };
}

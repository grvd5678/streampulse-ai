# StreamPulse AI 📡⚡
> **Real-Time Twitch Chat Intelligence & AI Stream Co-Pilot**  
> *Built for the Codex x TwitchCon Hackathon*

Fast-moving chat forces live streamers to choose between playing the game and acknowledging their community. **StreamPulse AI** turns chaotic chat into a focused co-pilot: it surfaces high-value viewer questions and lets the streamer bring one directly onto the broadcast overlay with one click, so they can acknowledge their audience without losing focus.

---

## 🎯 The Core Problem & Our Solution
* **The Problem**: During intense gameplay or coding streams, chat moves too fast to read. Critical viewer questions get swallowed by emote spam and meme trains.
* **The StreamPulse Solution**: 
  1. An intelligent real-time **Streamer Co-Pilot Dashboard** on your second monitor.
  2. Automatic extraction of genuine audience questions categorized by topic.
  3. A **one-click OBS Stream Spotlight** that projects the selected question onto the live broadcast for viewers to see.
  4. Rolling AI digests and live audience mood tracking.

---

## 🚀 Key Features

* **Instant Twitch IRC Ingestion**: Connect to any live Twitch channel (`#shroud`, `#tarik`, or your own) in seconds using `tmi.js` with zero OAuth friction.
* **15-Second Rolling AI Digest**: Batches incoming chat messages every 15 seconds into 3 concise bullet points summarizing what viewers are reacting to, community memes, and tips.
* **Smart Viewer Question Queue**: Extracts genuine questions asked by the audience with categorized tags (`Gameplay`, `Hardware`, `Personal`, `General`) and deduplicates repeated questions with viewer counts.
* **One-Click OBS Stream Spotlight**: Streamer can click **Pin** on any question to instantly animate it onto the live broadcast overlay.
* **Live Audience Vibe Meter**: Real-time sentiment gauge ranging from `-1.0` (Frustrated/Toxic) to `+1.0` (Hyped/Excited) using exact word-boundary token matching.
* **Transparent OBS Studio Browser Source**: Dedicated `/overlay` route with a transparent background that retains pinned questions even when refreshed or opened late.
* **Zero-Setup Interactive Simulator & "Analyze Now" Button**: Includes a high-speed chat simulator and an on-demand analysis trigger for fast, repeatable demo videos.

---

## 🛠️ Architecture & Tech Stack

```
[ Twitch Live Chat ] 
       │  (IRC stream via tmi.js)
       ▼
[ Node.js + Express Backend ] ──(Every 15s / on-demand)──► [ OpenAI / Gemini 1.5 Flash ]
       │                                                              │
       │                                                              ▼
       ├─────────────────► [ MongoDB Database ]              (Summary, Questions,
       │                   (Session logs & highlights)        Sentiment breakdown)
       │                                                              │
       ▼ (Real-time updates via Socket.io)                            │
       └──────────────────────────────────────────────────────────────┘
                         │
         ┌───────────────┴───────────────┐
         ▼                               ▼
  [ React Dashboard ]           [ OBS Browser Overlay ]
  (Streamer's dual-screen)      (On-stream transparent widget)
```

* **Frontend**: React 18, Vite, Tailwind CSS, Lucide Icons, Framer Motion
* **Backend**: Node.js, Express.js, Socket.IO, `tmi.js`
* **AI Engine**: Google Gemini API (`gemini-1.5-flash`) / OpenAI API (`gpt-4o-mini`) + Fallback heuristic engine
* **Database**: MongoDB (Mongoose ORM) with graceful offline fallback

---

## 📦 Getting Started

### 1. Prerequisites
* Node.js v18+ 
* (Optional) MongoDB running locally or MongoDB Atlas URI
* (Optional) OpenAI API Key or Google Gemini API Key

### 2. Backend Setup
```bash
cd server
npm install
npm start
```
*The server will start on `http://localhost:5000`.*

### 3. Frontend Setup
```bash
cd client
npm install
npm run dev
```
*Open `http://localhost:5173` in your browser to access the Streamer Dashboard.*

---

## 🎥 OBS Studio Overlay Setup

1. In OBS Studio, click **+** under **Sources** and select **Browser**.
2. Name it `StreamPulse Overlay`.
3. Set the **URL** to: `http://localhost:5173/overlay`.
4. Set **Width**: `1920`, **Height**: `1080`.
5. Check **"Shutdown source when not visible"** and click **OK**.
6. In your dashboard at `http://localhost:5173`, click **"Pin to Overlay"** on any viewer question—it will instantly animate on your stream!

---

## 🏆 Hackathon Tracks & Alignment
* **Help streamers create & manage content**: Streamers stay in their flow state without missing critical questions, technical audio alerts, or audience sentiment during intense broadcasts.
* **Stream broadcast production & overlays**: Bridges the backend AI intelligence layer directly into the video feed via an interactive, one-click OBS Studio lower-third spotlight.


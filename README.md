# StreamPulse AI 📡⚡
> **Real-Time Twitch Chat Intelligence & AI Stream Co-Pilot**  
> *Built for the Codex x TwitchCon Hackathon*

StreamPulse AI transforms high-speed, overwhelming Twitch chat into actionable real-time intelligence for live streamers. Instead of missing questions or relying on human moderators, StreamPulse acts as an automated AI co-pilot running directly on the streamer's second monitor and OBS broadcast overlay.

---

## 🚀 Key Features

* **Instant Twitch IRC Ingestion**: Connect to any live Twitch channel (`#shroud`, `#tarik`, or your own) in seconds using `tmi.js` with zero OAuth friction.
* **30-Second Rolling AI Digest**: Batches incoming chat messages into 3 concise bullet points summarizing what viewers are reacting to, community memes, and tips.
* **Smart Viewer Question Queue**: Extracts genuine questions asked by the audience with categorized tags (`Gameplay`, `Hardware`, `Personal`, `General`), complete with a **"Pin to OBS Overlay"** button and **"Mark Answered"** workflow.
* **Live Audience Vibe Meter**: Real-time sentiment gauge ranging from `-1.0` (Frustrated/Toxic) to `+1.0` (Hyped/Excited) with dynamic mood labeling.
* **Transparent OBS Studio Browser Source**: Dedicated `/overlay` route with a transparent background that floats pinned questions and live chat vibes directly over game broadcasts.
* **Zero-Setup Interactive Simulator**: Includes a built-in high-speed chat simulator so you can test all AI pipelines and demo the app without needing a live stream running.

---

## 🛠️ Architecture & Tech Stack

```
[ Twitch Live Chat ] 
       │  (IRC stream via tmi.js)
       ▼
[ Node.js + Express Backend ] ──(Every 25s / on-demand)──► [ OpenAI / Gemini 1.5 Flash ]
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
* **Give chat ways to play along**: Audiences see their questions highlighted live on stream via the OBS overlay.
* **Help streamers create & manage content**: Streamers never miss important questions during intense gameplay moments.


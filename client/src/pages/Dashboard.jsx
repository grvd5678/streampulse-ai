import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import SummaryFeed from '../components/SummaryFeed';
import QuestionQueue from '../components/QuestionQueue';
import SentimentGauge from '../components/SentimentGauge';
import LiveChatFeed from '../components/LiveChatFeed';
import { Key, Sparkles, X, Check, AlertCircle } from 'lucide-react';
import { useSocket } from '../context/SocketContext';

const rawServerUrl = import.meta.env.VITE_SERVER_URL || (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') ? 'http://localhost:5000' : 'https://streampulse-ai-j8br.onrender.com');
const SERVER_URL = rawServerUrl.replace(/\/+$/, '');

export default function Dashboard() {
  const [currentChannel, setCurrentChannel] = useState('grvd_live');
  const [showKeyModal, setShowKeyModal] = useState(false);
  const [openaiKeyInput, setOpenaiKeyInput] = useState('');
  const [geminiKeyInput, setGeminiKeyInput] = useState('');
  const [keySavedMessage, setKeySavedMessage] = useState('');
  const [keyErrorMessage, setKeyErrorMessage] = useState('');

  const { twitchStatus } = useSocket();

  useEffect(() => {
    if (twitchStatus.channel) {
      setCurrentChannel(twitchStatus.channel);
    }
  }, [twitchStatus.channel]);

  const handleConnect = async (channel) => {
    try {
      await fetch(`${SERVER_URL}/api/channel/connect`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ channel })
      });
      setCurrentChannel(channel);
    } catch (err) {
      console.error('Failed to connect:', err);
    }
  };

  const handleDisconnect = async () => {
    try {
      await fetch(`${SERVER_URL}/api/channel/disconnect`, { method: 'POST' });
    } catch (err) {
      console.error('Failed to disconnect:', err);
    }
  };

  const handleStartSimulator = async (channel) => {
    try {
      await fetch(`${SERVER_URL}/api/simulator/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ channel })
      });
      setCurrentChannel(channel || 'demo_stream');
    } catch (err) {
      console.error('Failed to start simulator:', err);
    }
  };

  const handleStopSimulator = async () => {
    try {
      await fetch(`${SERVER_URL}/api/simulator/stop`, { method: 'POST' });
    } catch (err) {
      console.error('Failed to stop simulator:', err);
    }
  };

  const handleSaveKeys = async (e) => {
    e.preventDefault();
    setKeyErrorMessage('');
    setKeySavedMessage('');

    try {
      const res = await fetch(`${SERVER_URL}/api/config/keys`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          openaiKey: openaiKeyInput.trim(),
          geminiKey: geminiKeyInput.trim()
        })
      });

      if (!res.ok) {
        throw new Error('Server rejected key configuration');
      }

      const data = await res.json();
      setKeySavedMessage('API keys successfully saved & persisted to .env!');
      setTimeout(() => {
        setKeySavedMessage('');
        setShowKeyModal(false);
      }, 1500);
    } catch (err) {
      setKeyErrorMessage(err.message || 'Failed to save keys');
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-twitch-bg">
      {/* Top Navigation */}
      <Navbar
        currentChannel={currentChannel}
        onConnect={handleConnect}
        onDisconnect={handleDisconnect}
        onStartSimulator={handleStartSimulator}
        onStopSimulator={handleStopSimulator}
      />

      {/* Main Streamer Co-Pilot Grid */}
      <main className="flex-1 p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 overflow-hidden">
        {/* Left Column (4 cols): Audience Vibe + Live Chat Stream */}
        <div className="lg:col-span-4 flex flex-col gap-6 h-full">
          <SentimentGauge />
          <div className="flex-1 min-h-[350px]">
            <LiveChatFeed />
          </div>
        </div>

        {/* Center Column (5 cols): AI Summary Digest */}
        <div className="lg:col-span-5 h-full min-h-[500px]">
          <SummaryFeed />
        </div>

        {/* Right Column (3 cols): Actionable Viewer Question Queue */}
        <div className="lg:col-span-3 h-full min-h-[500px]">
          <QuestionQueue />
        </div>
      </main>

      {/* Bottom Floating Bar */}
      <div className="px-6 py-2 border-t border-twitch-border bg-twitch-card flex items-center justify-between text-xs text-twitch-muted">
        <div className="flex items-center gap-2">
          <span>Active Target: <strong className="text-white">{twitchStatus.channel ? `#${twitchStatus.channel}` : 'None (Idle)'}</strong></span>
          {twitchStatus.isSimulator && (
            <span className="bg-orange-500/20 text-orange-400 px-1.5 py-0.5 rounded text-[10px] font-semibold">
              Simulator Active
            </span>
          )}
        </div>

        <button
          onClick={() => setShowKeyModal(true)}
          className="flex items-center gap-1.5 text-twitch-muted hover:text-white transition-colors"
        >
          <Key className="h-3.5 w-3.5" />
          <span>Configure API Keys (OpenAI / Gemini)</span>
        </button>
      </div>

      {/* API Key Modal */}
      {showKeyModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-twitch-card border border-twitch-border rounded-xl max-w-md w-full p-6 shadow-2xl relative">
            <button
              onClick={() => setShowKeyModal(false)}
              className="absolute top-4 right-4 text-twitch-muted hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="flex items-center gap-2.5 mb-4">
              <Key className="h-5 w-5 text-twitch-purple" />
              <h3 className="text-lg font-bold text-white">AI Provider Keys</h3>
            </div>

            <p className="text-xs text-twitch-muted mb-4 leading-relaxed">
              Keys are stored locally in your development <code className="text-twitch-purple">server/.env</code> file for local testing and hackathon demo runs.
            </p>

            <form onSubmit={handleSaveKeys} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-twitch-text mb-1">
                  Google Gemini API Key
                </label>
                <input
                  type="password"
                  value={geminiKeyInput}
                  onChange={(e) => setGeminiKeyInput(e.target.value)}
                  placeholder="AIzaSy..."
                  className="w-full bg-twitch-bg border border-twitch-border rounded-lg px-3 py-2 text-sm text-white placeholder-twitch-muted focus:border-twitch-purple focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-twitch-text mb-1">
                  OpenAI API Key
                </label>
                <input
                  type="password"
                  value={openaiKeyInput}
                  onChange={(e) => setOpenaiKeyInput(e.target.value)}
                  placeholder="sk-..."
                  className="w-full bg-twitch-bg border border-twitch-border rounded-lg px-3 py-2 text-sm text-white placeholder-twitch-muted focus:border-twitch-purple focus:outline-none"
                />
              </div>

              {keySavedMessage && (
                <div className="p-2 rounded bg-green-500/10 border border-green-500/30 text-xs text-green-400 flex items-center gap-1.5">
                  <Check className="h-3.5 w-3.5" />
                  {keySavedMessage}
                </div>
              )}

              {keyErrorMessage && (
                <div className="p-2 rounded bg-red-500/10 border border-red-500/30 text-xs text-red-400 flex items-center gap-1.5">
                  <AlertCircle className="h-3.5 w-3.5" />
                  {keyErrorMessage}
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowKeyModal(false)}
                  className="px-4 py-2 rounded-lg border border-twitch-border text-sm text-twitch-muted hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-twitch-purple text-sm font-semibold text-white hover:bg-twitch-purpleDark shadow-sm"
                >
                  Save Keys
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

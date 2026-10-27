import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import SummaryFeed from '../components/SummaryFeed';
import QuestionQueue from '../components/QuestionQueue';
import SentimentGauge from '../components/SentimentGauge';
import LiveChatFeed from '../components/LiveChatFeed';
import { Key, Sparkles, X, Check } from 'lucide-react';

export default function Dashboard() {
  const [currentChannel, setCurrentChannel] = useState('shroud');
  const [isSimulator, setIsSimulator] = useState(false);
  const [showKeyModal, setShowKeyModal] = useState(false);
  const [openaiKeyInput, setOpenaiKeyInput] = useState('');
  const [geminiKeyInput, setGeminiKeyInput] = useState('');
  const [keySavedMessage, setKeySavedMessage] = useState('');

  // Fetch initial status
  useEffect(() => {
    fetch('http://localhost:5000/api/status')
      .then(res => res.json())
      .then(data => {
        if (data.channel) setCurrentChannel(data.channel);
        setIsSimulator(data.isSimulator);
      })
      .catch(() => {});
  }, []);

  const handleConnect = async (channel) => {
    try {
      const res = await fetch('http://localhost:5000/api/channel/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ channel })
      });
      const data = await res.json();
      setCurrentChannel(channel);
      setIsSimulator(false);
    } catch (err) {
      console.error('Failed to connect:', err);
    }
  };

  const handleDisconnect = async () => {
    try {
      await fetch('http://localhost:5000/api/channel/disconnect', { method: 'POST' });
      setIsSimulator(false);
    } catch (err) {
      console.error('Failed to disconnect:', err);
    }
  };

  const handleStartSimulator = async (channel) => {
    try {
      await fetch('http://localhost:5000/api/simulator/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ channel })
      });
      setIsSimulator(true);
      setCurrentChannel(channel || 'demo_stream');
    } catch (err) {
      console.error('Failed to start simulator:', err);
    }
  };

  const handleStopSimulator = async () => {
    try {
      await fetch('http://localhost:5000/api/simulator/stop', { method: 'POST' });
      setIsSimulator(false);
    } catch (err) {
      console.error('Failed to stop simulator:', err);
    }
  };

  const handleSaveKeys = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('http://localhost:5000/api/config/keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          openaiKey: openaiKeyInput.trim(),
          geminiKey: geminiKeyInput.trim()
        })
      });
      const data = await res.json();
      setKeySavedMessage('API Keys saved successfully!');
      setTimeout(() => {
        setKeySavedMessage('');
        setShowKeyModal(false);
      }, 1500);
    } catch (err) {
      console.error('Failed to save keys:', err);
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
        isSimulator={isSimulator}
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
          <span>Target Channel: <strong className="text-white">#{currentChannel}</strong></span>
          {isSimulator && <span className="bg-orange-500/20 text-orange-400 px-1.5 py-0.5 rounded text-[10px] font-semibold">Simulator Active</span>}
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
              StreamPulse uses either OpenAI or Google Gemini for live chat summaries. If no keys are provided, it automatically runs in high-speed intelligent simulator mode.
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

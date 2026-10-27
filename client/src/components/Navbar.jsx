import React, { useState } from 'react';
import { Radio, Play, Square, ExternalLink, Sparkles, Settings, Activity } from 'lucide-react';
import { useSocket } from '../context/SocketContext';

export default function Navbar({ currentChannel, onConnect, onDisconnect, onStartSimulator, onStopSimulator, isSimulator }) {
  const [channelInput, setChannelInput] = useState(currentChannel || 'shroud');
  const { isConnected, velocity } = useSocket();

  const handleConnect = (e) => {
    e.preventDefault();
    if (channelInput.trim()) {
      onConnect(channelInput.trim());
    }
  };

  return (
    <header className="border-b border-twitch-border bg-twitch-card px-6 py-3">
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Logo & Brand */}
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-twitch-purple text-white shadow-lg shadow-twitch-purple/20">
            <Radio className="h-6 w-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight text-white">StreamPulse AI</h1>
              <span className="rounded-full bg-twitch-purple/20 px-2 py-0.5 text-xs font-semibold text-twitch-purple border border-twitch-purple/30">
                Co-Pilot v1.0
              </span>
            </div>
            <p className="text-xs text-twitch-muted">Real-Time Twitch Chat Intelligence Engine</p>
          </div>
        </div>

        {/* Live Channel Connection Controls */}
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <form onSubmit={handleConnect} className="flex items-center gap-2 flex-grow md:flex-grow-0">
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-twitch-muted text-sm">#</span>
              <input
                type="text"
                value={channelInput}
                onChange={(e) => setChannelInput(e.target.value)}
                placeholder="twitch_channel"
                className="w-40 md:w-48 rounded-lg bg-twitch-bg border border-twitch-border pl-7 pr-3 py-1.5 text-sm text-white placeholder-twitch-muted focus:border-twitch-purple focus:outline-none focus:ring-1 focus:ring-twitch-purple"
              />
            </div>
            <button
              type="submit"
              className="flex items-center gap-1.5 rounded-lg bg-twitch-purple px-4 py-1.5 text-sm font-medium text-white hover:bg-twitch-purpleDark transition-colors shadow-sm"
            >
              <Play className="h-3.5 w-3.5 fill-current" />
              Connect
            </button>
          </form>

          {/* Simulator Toggle */}
          <button
            onClick={isSimulator ? onStopSimulator : () => onStartSimulator(channelInput)}
            className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors ${
              isSimulator
                ? 'border-red-500/50 bg-red-500/10 text-red-400 hover:bg-red-500/20'
                : 'border-twitch-border bg-twitch-hover text-twitch-muted hover:text-white hover:border-twitch-purple/50'
            }`}
            title="Simulate high-volume chat messages without needing an active live stream"
          >
            <Sparkles className="h-3.5 w-3.5" />
            {isSimulator ? 'Stop Sim' : 'Demo Sim'}
          </button>

          {/* OBS Overlay Link */}
          <a
            href="/overlay"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 rounded-lg border border-twitch-border bg-twitch-bg px-3 py-1.5 text-sm font-medium text-twitch-text hover:text-twitch-purple hover:border-twitch-purple transition-colors"
            title="Open transparent browser source for OBS Studio"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            OBS Overlay
          </a>

          {/* Connection Status Badge */}
          <div className="flex items-center gap-2 rounded-lg bg-twitch-bg px-3 py-1.5 border border-twitch-border">
            <span className={`h-2.5 w-2.5 rounded-full ${isConnected ? 'bg-twitch-accent animate-ping' : 'bg-red-500'}`} />
            <span className="text-xs font-semibold text-twitch-muted">
              {isConnected ? `${velocity.msgsPerSecond} msg/s` : 'Offline'}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}

import React, { useState } from 'react';
import { Radio, Play, Square, ExternalLink, Sparkles, Zap, Activity } from 'lucide-react';
import { useSocket } from '../context/SocketContext';

export default function Navbar({ currentChannel, onConnect, onDisconnect, onStartSimulator, onStopSimulator }) {
  const [channelInput, setChannelInput] = useState(currentChannel || 'shroud');
  const { isConnected, twitchStatus, velocity, triggerAnalyzeNow, isAnalyzing } = useSocket();

  const isLive = twitchStatus.isTwitchConnected;
  const isSim = twitchStatus.isSimulator;

  const handleConnect = (e) => {
    e.preventDefault();
    if (channelInput.trim()) {
      onConnect(channelInput.trim());
    }
  };

  return (
    <header className="border-b border-twitch-border bg-twitch-card px-6 py-3">
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-twitch-purple text-white shadow-lg shadow-twitch-purple/20">
            <Radio className="h-6 w-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight text-white">StreamPulse AI</h1>
              <span className="rounded-full bg-twitch-purple/20 px-2 py-0.5 text-xs font-semibold text-twitch-purple border border-twitch-purple/30">
                Co-Pilot
              </span>
            </div>
            <p className="text-xs text-twitch-muted">Real-Time Twitch Chat Intelligence Engine</p>
          </div>
        </div>

        {/* Controls */}
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {/* Quick Connect Form */}
          <form onSubmit={handleConnect} className="flex items-center gap-2 flex-grow md:flex-grow-0">
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-twitch-muted text-sm">#</span>
              <input
                type="text"
                value={channelInput}
                onChange={(e) => setChannelInput(e.target.value)}
                placeholder="channel_name"
                className="w-36 md:w-44 rounded-lg bg-twitch-bg border border-twitch-border pl-7 pr-3 py-1.5 text-sm text-white placeholder-twitch-muted focus:border-twitch-purple focus:outline-none"
              />
            </div>
            <button
              type="submit"
              className="flex items-center gap-1.5 rounded-lg bg-twitch-purple px-3.5 py-1.5 text-sm font-medium text-white hover:bg-twitch-purpleDark transition-colors shadow-sm"
            >
              <Play className="h-3.5 w-3.5 fill-current" />
              Connect
            </button>
          </form>

          {/* Simulator Toggle */}
          <button
            onClick={isSim ? onStopSimulator : () => onStartSimulator(channelInput)}
            className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors ${
              isSim
                ? 'border-red-500/50 bg-red-500/10 text-red-400 hover:bg-red-500/20'
                : 'border-twitch-border bg-twitch-hover text-twitch-muted hover:text-white hover:border-twitch-purple/50'
            }`}
            title="Toggle realistic high-speed chat simulator"
          >
            <Sparkles className="h-3.5 w-3.5" />
            {isSim ? 'Stop Sim' : 'Demo Sim'}
          </button>

          {/* Instant "Analyze Now" Button */}
          <button
            onClick={triggerAnalyzeNow}
            disabled={isAnalyzing || (!isLive && !isSim)}
            className="flex items-center gap-1.5 rounded-lg border border-yellow-500/30 bg-yellow-500/10 text-yellow-400 hover:bg-yellow-500/20 px-3 py-1.5 text-sm font-semibold transition-all disabled:opacity-40 disabled:pointer-events-none shadow-sm"
            title="Force immediate AI analysis on the current chat batch"
          >
            <Zap className={`h-3.5 w-3.5 ${isAnalyzing ? 'animate-spin' : 'fill-current'}`} />
            {isAnalyzing ? 'Analyzing...' : 'Analyze Now'}
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

          {/* Real Stream Status Badge */}
          <div className="flex items-center gap-2 rounded-lg bg-twitch-bg px-3 py-1.5 border border-twitch-border">
            <span
              className={`h-2.5 w-2.5 rounded-full ${
                isLive
                  ? 'bg-twitch-accent animate-ping'
                  : isSim
                  ? 'bg-orange-400 animate-pulse'
                  : 'bg-red-500'
              }`}
            />
            <span className="text-xs font-bold text-white">
              {isLive
                ? `LIVE: #${twitchStatus.channel}`
                : isSim
                ? `SIM: #${twitchStatus.channel}`
                : 'IDLE'}
            </span>
            <span className="text-[11px] text-twitch-muted font-mono">
              ({velocity.msgsPerSecond} msg/s)
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}

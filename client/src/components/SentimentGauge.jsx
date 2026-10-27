import React from 'react';
import { Heart, Flame, Smile, Frown, HelpCircle, Activity } from 'lucide-react';
import { useSocket } from '../context/SocketContext';

export default function SentimentGauge() {
  const { sentiment, velocity } = useSocket();
  const score = sentiment.score || 0; // -1 to 1
  const label = sentiment.label || 'Neutral';

  // Calculate percentage from 0% to 100%
  const percentage = Math.round(((score + 1) / 2) * 100);

  const getVibeIcon = () => {
    switch (label) {
      case 'Hyped': return <Flame className="h-5 w-5 text-orange-400 animate-bounce" />;
      case 'Laughing': return <Smile className="h-5 w-5 text-yellow-400 animate-spin" />;
      case 'Confused': return <HelpCircle className="h-5 w-5 text-blue-400" />;
      case 'Frustrated':
      case 'Toxic': return <Frown className="h-5 w-5 text-red-400" />;
      default: return <Heart className="h-5 w-5 text-twitch-purple" />;
    }
  };

  const getColor = () => {
    if (score > 0.4) return 'from-twitch-purple to-orange-500';
    if (score > 0) return 'from-blue-500 to-twitch-accent';
    if (score > -0.3) return 'from-yellow-500 to-blue-500';
    return 'from-red-500 to-orange-500';
  };

  return (
    <div className="bg-twitch-card border border-twitch-border rounded-xl p-4 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          {getVibeIcon()}
          <h2 className="font-semibold text-white">Live Audience Vibe</h2>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-twitch-muted bg-twitch-bg px-2.5 py-1 rounded-full border border-twitch-border">
          <Activity className="h-3.5 w-3.5 text-twitch-accent animate-pulse" />
          <span>{velocity.msgsPerMinute} msg/min</span>
        </div>
      </div>

      {/* Main Vibe Display */}
      <div className="flex items-baseline justify-between mb-2">
        <span className="text-2xl font-bold text-white tracking-tight">{label}</span>
        <span className="text-xs font-semibold text-twitch-muted">
          Index: <span className="text-white">{(score > 0 ? '+' : '') + score.toFixed(2)}</span>
        </span>
      </div>

      {/* Progress Bar Gauge */}
      <div className="w-full bg-twitch-bg rounded-full h-3 p-0.5 border border-twitch-border overflow-hidden">
        <div
          className={`h-full rounded-full bg-gradient-to-r ${getColor()} transition-all duration-500`}
          style={{ width: `${Math.max(5, Math.min(100, percentage))}%` }}
        />
      </div>

      <div className="flex justify-between text-[10px] text-twitch-muted mt-1.5 px-0.5 font-medium">
        <span>Frustrated (-1.0)</span>
        <span>Neutral (0.0)</span>
        <span>Hyped (+1.0)</span>
      </div>
    </div>
  );
}


import React from 'react';
import { useSocket } from '../context/SocketContext';
import { motion, AnimatePresence } from 'framer-motion';
import { HelpCircle, Activity, Flame, Smile, Heart } from 'lucide-react';

export default function Overlay() {
  const { pinnedQuestion, sentiment } = useSocket();

  const getVibeIcon = () => {
    switch (sentiment.label) {
      case 'Hyped': return <Flame className="h-4 w-4 text-orange-400 animate-bounce" />;
      case 'Laughing': return <Smile className="h-4 w-4 text-yellow-400" />;
      default: return <Heart className="h-4 w-4 text-twitch-purple" />;
    }
  };

  return (
    <div className="w-screen h-screen bg-transparent p-8 flex flex-col justify-between pointer-events-none select-none font-sans overflow-hidden">
      {/* Top-Right: Mini Chat Vibe Pulse Badge */}
      <div className="flex justify-end">
        <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-black/70 backdrop-blur-md border border-white/10 shadow-2xl text-white">
          <span className="flex h-2 w-2 rounded-full bg-twitch-accent animate-ping" />
          {getVibeIcon()}
          <span className="text-xs font-semibold tracking-wide uppercase">
            Chat Vibe: <strong className="text-twitch-accent">{sentiment.label || 'Hyped'}</strong>
          </span>
        </div>
      </div>

      {/* Bottom-Center: Lower-Third Pinned Question Card */}
      <div className="flex justify-center mb-6">
        <AnimatePresence>
          {pinnedQuestion && (
            <motion.div
              initial={{ opacity: 0, y: 50, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 30, scale: 0.9 }}
              transition={{ type: 'spring', damping: 20, stiffness: 300 }}
              className="max-w-xl w-full rounded-2xl bg-gradient-to-r from-twitch-card/95 to-black/95 backdrop-blur-lg border-2 border-twitch-purple shadow-2xl p-4 text-white"
            >
              <div className="flex items-center justify-between mb-2 pb-2 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-twitch-purple text-white text-xs font-bold">
                    Q
                  </span>
                  <span className="text-xs font-bold text-twitch-purple tracking-wide uppercase">
                    Viewer Question
                  </span>
                </div>
                <span className="text-xs font-semibold text-white/80 bg-white/10 px-2 py-0.5 rounded-full">
                  @{pinnedQuestion.user}
                </span>
              </div>

              <p className="text-base font-bold text-white leading-snug drop-shadow-sm">
                "{pinnedQuestion.question}"
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}


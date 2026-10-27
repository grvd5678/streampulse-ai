import React from 'react';
import { Sparkles, Clock, AlertTriangle, CheckCircle2, BookmarkPlus, BookmarkCheck } from 'lucide-react';
import { useSocket } from '../context/SocketContext';
import { motion, AnimatePresence } from 'framer-motion';

export default function SummaryFeed() {
  const { summaries, alerts, highlights, saveHighlight } = useSocket();

  return (
    <div className="flex flex-col h-full bg-twitch-card border border-twitch-border rounded-xl p-4 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-twitch-border">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-twitch-purple" />
          <h2 className="font-semibold text-white">AI Stream Digest</h2>
        </div>
        <span className="text-xs bg-twitch-bg text-twitch-muted px-2 py-0.5 rounded border border-twitch-border">
          {summaries[0]?.timestamp ? `Updated ${new Date(summaries[0].timestamp).toLocaleTimeString()}` : 'Waiting for first digest'}
        </span>
      </div>

      {/* Critical Alerts Banner (if any) */}
      {alerts && alerts.length > 0 && (
        <div className="mt-3 p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/30 flex items-start gap-2.5">
          <AlertTriangle className="h-5 w-5 text-yellow-400 flex-shrink-0 mt-0.5" />
          <div className="text-xs text-yellow-200">
            <span className="font-bold">Chat Alert:</span> {alerts[0]}
          </div>
        </div>
      )}

      {/* Feed List */}
      <div className="flex-1 overflow-y-auto mt-3 pr-1 space-y-3">
        {summaries.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-center text-twitch-muted">
            <Sparkles className="h-8 w-8 mb-2 opacity-30 text-twitch-purple" />
            <p className="text-sm">Listening to chat messages...</p>
            <p className="text-xs text-twitch-muted/70 mt-1">The first AI summary will generate within 25 seconds.</p>
          </div>
        ) : (
          <AnimatePresence>
            {summaries.map((item, index) => {
              const timeStr = item.timestamp ? new Date(item.timestamp).toLocaleTimeString() : 'Just now';
              return (
                <motion.div
                  key={item.id || index}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className={`rounded-lg p-3.5 border transition-all ${
                    index === 0
                      ? 'bg-twitch-hover/80 border-twitch-purple/40 shadow-sm'
                      : 'bg-twitch-bg/60 border-twitch-border text-twitch-muted'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs mb-2">
                    <span className="flex items-center gap-1 font-semibold text-twitch-purple">
                      <Clock className="h-3 w-3" />
                      {timeStr}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="rounded bg-twitch-bg px-2 py-0.5 text-[10px] text-twitch-muted border border-twitch-border">{item.messageCount || 0} msgs</span>
                      <button onClick={() => saveHighlight({ timestamp: item.timestamp, title: 'Chat digest saved', bullets: item.bullets })} className="inline-flex items-center gap-1 rounded border border-twitch-border px-2 py-1 text-[10px] font-semibold text-twitch-muted hover:border-twitch-purple hover:text-white" title="Save this digest to review after stream"><BookmarkPlus className="h-3 w-3" /> Save moment</button>
                    </div>
                  </div>

                  <ul className="space-y-1.5 text-sm text-twitch-text">
                    {item.bullets?.map((b, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 text-twitch-purple flex-shrink-0 mt-0.5" />
                        <span className="leading-snug">{b}</span>
                      </li>
                    ))}
                  </ul>
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}
        {highlights.length > 0 && <div className="mt-4 border-t border-twitch-border pt-3">
          <div className="mb-2 flex items-center gap-2 text-xs font-semibold text-twitch-accent"><BookmarkCheck className="h-3.5 w-3.5" /> Saved for after stream ({highlights.length})</div>
          {highlights.slice(0, 3).map(item => <div key={item.id} className="mb-2 rounded-lg border border-twitch-border bg-twitch-bg p-2.5 text-xs text-twitch-text"><div className="mb-1 text-[10px] text-twitch-muted">{new Date(item.timestamp).toLocaleTimeString()} · {item.title}</div>{item.details}</div>)}
        </div>}
      </div>
    </div>
  );
}


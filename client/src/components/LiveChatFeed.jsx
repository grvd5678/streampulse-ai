import React from 'react';
import { MessageSquare, ShieldAlert } from 'lucide-react';
import { useSocket } from '../context/SocketContext';

export default function LiveChatFeed() {
  const { rawMessages } = useSocket();

  return (
    <div className="flex flex-col h-full bg-twitch-card border border-twitch-border rounded-xl p-4 shadow-sm">
      <div className="flex items-center justify-between pb-3 border-b border-twitch-border">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5 text-twitch-purple" />
          <h2 className="font-semibold text-white">Live Twitch Stream</h2>
        </div>
        <span className="text-[10px] bg-twitch-bg text-twitch-muted px-2 py-0.5 rounded border border-twitch-border">
          IRC Stream
        </span>
      </div>

      <div className="flex-1 overflow-y-auto mt-3 pr-1 space-y-1.5 text-xs font-mono">
        {rawMessages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-center text-twitch-muted">
            <MessageSquare className="h-6 w-6 mb-2 opacity-30" />
            <p>Waiting for chat messages...</p>
          </div>
        ) : (
          rawMessages.map((m) => (
            <div key={m.id} className="leading-relaxed hover:bg-twitch-hover/50 px-1 py-0.5 rounded">
              <span className="text-twitch-muted text-[10px] mr-1.5">
                {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </span>
              <span className="font-semibold" style={{ color: m.color || '#9146FF' }}>
                {m.user}:
              </span>{' '}
              <span className="text-twitch-text">{m.message}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

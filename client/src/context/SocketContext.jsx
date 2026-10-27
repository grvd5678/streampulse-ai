import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';

const SocketContext = createContext();

const SOCKET_URL = 'http://localhost:5000';

export const SocketProvider = ({ children, role = 'dashboard' }) => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [twitchStatus, setTwitchStatus] = useState({
    channel: null,
    isTwitchConnected: false,
    isSimulator: false
  });
  const [summaries, setSummaries] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [sentiment, setSentiment] = useState({ score: 0.0, label: 'Neutral' });
  const [velocity, setVelocity] = useState({ msgsPerMinute: 0, msgsPerSecond: 0 });
  const [rawMessages, setRawMessages] = useState([]);
  const [pinnedQuestion, setPinnedQuestion] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  useEffect(() => {
    const s = io(SOCKET_URL, {
      query: { role }
    });

    s.on('connect', () => {
      console.log(`Connected to StreamPulse WebSocket (${role})`);
      setIsConnected(true);
      // Fetch initial status on connect
      fetch(`${SOCKET_URL}/api/status`)
        .then(res => res.json())
        .then(data => {
          setTwitchStatus({
            channel: data.channel,
            isTwitchConnected: data.isTwitchConnected,
            isSimulator: data.isSimulator
          });
          if (data.velocity) setVelocity(data.velocity);
        })
        .catch(() => {});
    });

    s.on('disconnect', () => {
      console.log('Disconnected from StreamPulse WebSocket');
      setIsConnected(false);
    });

    // True Twitch/Simulator status from backend
    s.on('twitch_status', (status) => {
      console.log('Twitch status update:', status);
      setTwitchStatus({
        channel: status.channel,
        isTwitchConnected: status.isTwitchConnected,
        isSimulator: status.isSimulator
      });
      if (status.velocity) setVelocity(status.velocity);
    });

    // Listen to AI summaries (with full payload deduplication)
    s.on('ai_summary_update', (data) => {
      console.log('AI Summary Received:', data);
      setIsAnalyzing(false);

      if (!data || !data.id) return;

      // Ensure the ENTIRE payload is only processed once
      setSummaries(prev => {
        if (prev.some(item => item.id === data.id)) {
          return prev; // Already processed this analysis ID
        }

        // Only append questions if this analysis batch is fresh
        if (data.questions && data.questions.length > 0) {
          setQuestions(prevQ => {
            const newQuestions = data.questions.map(q => ({
              ...q,
              id: `${data.id}-${q.question.slice(0, 10)}-${Math.random()}`,
              timestamp: new Date(),
              isAnswered: false,
              isPinned: false
            }));
            return [...newQuestions, ...prevQ].slice(0, 30);
          });
        }

        // Only append alerts if this analysis batch is fresh
        if (data.alerts && data.alerts.length > 0) {
          setAlerts(prevA => [...data.alerts, ...prevA].slice(0, 10));
        }

        if (data.sentiment) {
          setSentiment(data.sentiment);
        }

        return [data, ...prev.slice(0, 19)];
      });
    });

    // Listen to live raw chat
    s.on('raw_chat_message', (msg) => {
      setRawMessages(prev => [msg, ...prev.slice(0, 49)]);
    });

    // Listen to velocity
    s.on('velocity_update', (vel) => {
      setVelocity(vel);
    });

    // Overlay events (including late-join initial state)
    s.on('overlay_pinned_question', (q) => {
      console.log('Overlay received pinned question:', q);
      setPinnedQuestion(q);
    });

    s.on('overlay_unpin_question', () => {
      setPinnedQuestion(null);
    });

    s.on('overlay_vibe_update', (data) => {
      if (data.sentiment) setSentiment(data.sentiment);
    });

    setSocket(s);

    return () => {
      s.disconnect();
    };
  }, [role]);

  const pinQuestion = (question) => {
    if (socket) {
      socket.emit('pin_question', question);
      setQuestions(prev => prev.map(q => q.id === question.id ? { ...q, isPinned: true } : q));
      setPinnedQuestion(question);
    }
  };

  const unpinQuestion = () => {
    if (socket) {
      socket.emit('unpin_question');
      setQuestions(prev => prev.map(q => ({ ...q, isPinned: false })));
      setPinnedQuestion(null);
    }
  };

  const markQuestionAnswered = (id) => {
    setQuestions(prev => prev.map(q => q.id === id ? { ...q, isAnswered: true } : q));
  };

  const triggerAnalyzeNow = async () => {
    setIsAnalyzing(true);
    try {
      const res = await fetch(`${SOCKET_URL}/api/analyze-now`, { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        // Fallback update in case websocket is delayed
        if (data?.result?.id) {
          setSummaries(prev => prev.some(item => item.id === data.result.id) ? prev : [data.result, ...prev.slice(0, 19)]);
        }
      }
    } catch (e) {
      console.error('Failed to trigger manual analysis:', e);
    } finally {
      setIsAnalyzing(false); // Deterministic reset: guaranteed never stuck
    }
  };

  const [highlights, setHighlights] = useState([]);

  return (
    <SocketContext.Provider value={{
      socket,
      isConnected,
      twitchStatus,
      summaries,
      questions,
      sentiment,
      velocity,
      rawMessages,
      pinnedQuestion,
      alerts,
      highlights,
      isAnalyzing,
      pinQuestion,
      unpinQuestion,
      markQuestionAnswered,
      triggerAnalyzeNow
    }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);

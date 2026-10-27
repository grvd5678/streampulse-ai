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
  const [sentiment, setSentiment] = useState({ score: 0.85, label: 'Hyped' });
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

    // Listen to AI summaries
    s.on('ai_summary_update', (data) => {
      console.log('AI Summary Received:', data);
      setIsAnalyzing(false);
      setSummaries(prev => [data, ...prev.slice(0, 19)]);

      if (data.questions && data.questions.length > 0) {
        setQuestions(prev => {
          const newQuestions = data.questions.map(q => ({
            ...q,
            id: `${Date.now()}-${Math.random()}`,
            timestamp: new Date(),
            isAnswered: false,
            isPinned: false
          }));
          return [...newQuestions, ...prev].slice(0, 30);
        });
      }

      if (data.sentiment) {
        setSentiment(data.sentiment);
      }

      if (data.alerts && data.alerts.length > 0) {
        setAlerts(prev => [...data.alerts, ...prev].slice(0, 10));
      }
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
      await fetch(`${SOCKET_URL}/api/analyze-now`, { method: 'POST' });
    } catch (e) {
      setIsAnalyzing(false);
    }
  };

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

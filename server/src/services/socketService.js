let ioInstance = null;
let currentlyPinnedQuestion = null;
let lastKnownSentiment = { score: 0.0, label: 'Neutral' };

export function initSocketIO(io) {
  ioInstance = io;

  io.on('connection', (socket) => {
    const role = socket.handshake.query.role || 'dashboard';
    socket.join(role);
    console.log(`⚡ Client connected (${role}): ${socket.id}`);

    // If an overlay connects late, immediately send the currently pinned question & vibe
    if (role === 'overlay') {
      if (currentlyPinnedQuestion) {
        socket.emit('overlay_pinned_question', currentlyPinnedQuestion);
      }
      socket.emit('overlay_vibe_update', { sentiment: lastKnownSentiment });
    }

    // Streamer clicks "Pin Question to OBS Overlay"
    socket.on('pin_question', (questionData) => {
      console.log('📌 Pinning question to overlay:', questionData?.question);
      currentlyPinnedQuestion = questionData;
      ioInstance.to('overlay').emit('overlay_pinned_question', questionData);
    });

    // Streamer clears pinned question from OBS
    socket.on('unpin_question', () => {
      console.log('📌 Unpinning question from overlay');
      currentlyPinnedQuestion = null;
      ioInstance.to('overlay').emit('overlay_unpin_question');
    });

    socket.on('disconnect', () => {
      console.log(`🔌 Client disconnected: ${socket.id}`);
    });
  });
}

export function broadcastToDashboard(event, data) {
  if (ioInstance) {
    ioInstance.to('dashboard').emit(event, data);
  }
}

export function broadcastToOverlay(event, data) {
  if (ioInstance) {
    if (event === 'overlay_vibe_update' && data?.sentiment) {
      lastKnownSentiment = data.sentiment;
    }
    ioInstance.to('overlay').emit(event, data);
  }
}

export function broadcastToAll(event, data) {
  if (ioInstance) {
    ioInstance.emit(event, data);
  }
}

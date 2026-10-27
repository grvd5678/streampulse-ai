let ioInstance = null;

export function initSocketIO(io) {
  ioInstance = io;

  io.on('connection', (socket) => {
    // Determine client role: dashboard or overlay
    const role = socket.handshake.query.role || 'dashboard';
    socket.join(role);
    console.log(`⚡ Client connected (${role}): ${socket.id}`);

    // Streamer clicks "Pin Question to OBS Overlay"
    socket.on('pin_question', (questionData) => {
      console.log('📌 Pinning question to overlay:', questionData);
      ioInstance.to('overlay').emit('overlay_pinned_question', questionData);
    });

    // Streamer clears pinned question from OBS
    socket.on('unpin_question', () => {
      console.log('📌 Unpinning question from overlay');
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
    ioInstance.to('overlay').emit(event, data);
  }
}

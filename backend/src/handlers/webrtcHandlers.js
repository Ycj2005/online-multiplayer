// WebRTC Signaling Handlers
export function setupWebRTCHandlers(io, socket, userManager, roomManager) {
  // WebRTC Offer
  socket.on("webrtcOffer", ({ roomId, to, offer }) => {
    const from = userManager.getUser(socket.id);
    if (!from) return;

    io.to(to).emit("webrtcOffer", {
      from: socket.id,
      fromUsername: from.username,
      offer: offer,
    });

    console.log(`WebRTC Offer from ${from.username} to ${to}`);
  });

  // WebRTC Answer
  socket.on("webrtcAnswer", ({ roomId, to, answer }) => {
    const from = userManager.getUser(socket.id);
    if (!from) return;

    io.to(to).emit("webrtcAnswer", {
      from: socket.id,
      fromUsername: from.username,
      answer: answer,
    });

    console.log(`WebRTC Answer from ${from.username} to ${to}`);
  });

  // ICE Candidate
  socket.on("iceCandidate", ({ roomId, to, candidate }) => {
    io.to(to).emit("iceCandidate", {
      from: socket.id,
      candidate: candidate,
    });
  });

  // Call User
  socket.on("callUser", ({ roomId, targetUserId }) => {
    const user = userManager.getUser(socket.id);
    if (!user) return;

    io.to(targetUserId).emit("incomingCall", {
      from: socket.id,
      fromUsername: user.username,
      fromAvatar: user.avatar,
      roomId: roomId,
    });

    console.log(`Call initiated from ${user.username} to ${targetUserId}`);
  });

  // Call Accepted
  socket.on("callAccepted", ({ from, roomId }) => {
    io.to(from).emit("callAccepted", {
      to: socket.id,
      roomId: roomId,
    });
  });

  // Call Rejected
  socket.on("callRejected", ({ from }) => {
    io.to(from).emit("callRejected", {
      from: socket.id,
    });
  });

  // End Call
  socket.on("endCall", ({ roomId, targetUserId }) => {
    io.to(targetUserId).emit("callEnded", {
      from: socket.id,
    });
  });
}

// Chat Event Handlers
export function setupChatHandlers(io, socket, userManager, roomManager) {
  // Global Chat Message
  socket.on("chatMessage", (data) => {
    const user = userManager.getUser(socket.id);
    if (!user) return;

    const messageData = {
      id: Date.now(),
      userId: socket.id,
      username: user.username,
      avatar: user.avatar,
      message: data.message,
      timestamp: new Date(),
      type: "message",
    };

    io.emit("chatMessage", messageData);
  });

  // Room Chat Message
  socket.on("roomChatMessage", ({ roomId, message }) => {
    const user = userManager.getUser(socket.id);
    if (!user) return;

    const room = roomManager.getRoom(roomId);
    if (!room) return;

    const messageData = {
      id: Date.now(),
      userId: socket.id,
      username: user.username,
      avatar: user.avatar,
      message: message,
      timestamp: new Date(),
      type: "message",
    };

    roomManager.addMessage(roomId, messageData);
    io.to(roomId).emit("roomChatMessage", messageData);
  });

  // Typing Indicator
  socket.on("typing", ({ roomId, username }) => {
    if (roomId) {
      socket.broadcast.to(roomId).emit("userTyping", { username });
    } else {
      socket.broadcast.emit("userTyping", { username });
    }
  });

  socket.on("stopTyping", ({ roomId }) => {
    if (roomId) {
      socket.broadcast.to(roomId).emit("userStoppedTyping", {});
    } else {
      socket.broadcast.emit("userStoppedTyping", {});
    }
  });
}

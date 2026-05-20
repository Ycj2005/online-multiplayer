// Connection Event Handlers
export function setupConnectionHandlers(io, socket, userManager, roomManager) {
  // User Join
  socket.on("userJoined", (userData) => {
    userManager.addUser(socket.id, userData);

    socket.emit("connected", {
      userId: socket.id,
      username: userData.username,
    });

    io.emit("onlineUsers", userManager.getOnlineUsers());
    io.emit("userOnline", {
      userId: socket.id,
      username: userData.username,
      avatar: userData.avatar,
    });

    console.log(`User joined: ${userData.username} (${socket.id})`);
  });

  // Disconnect
  socket.on("disconnect", () => {
    const user = userManager.getUser(socket.id);
    if (!user) return;

    const currentRoom = user.currentRoom;

    // Remove from room
    if (currentRoom) {
      const result = roomManager.leaveRoom(currentRoom, socket.id);
      if (result === "deleted") {
        io.emit("roomDeleted", { roomId: currentRoom });
      } else {
        io.to(currentRoom).emit("userLeftRoom", {
          userId: socket.id,
          username: user.username,
        });
      }
    }

    userManager.removeUser(socket.id);

    io.emit("onlineUsers", userManager.getOnlineUsers());
    io.emit("userOffline", {
      userId: socket.id,
      username: user.username,
    });

    io.emit("roomListUpdated", roomManager.getAllRooms());

    console.log(`User disconnected: ${user.username} (${socket.id})`);
  });

  // Get Online Users
  socket.on("getOnlineUsers", () => {
    socket.emit("onlineUsers", userManager.getOnlineUsers());
  });
}

// Room Event Handlers
export function setupRoomHandlers(io, socket, userManager, roomManager) {
  // Create Room
  socket.on("createRoom", ({ roomId, password, maxUsers }) => {
    const user = userManager.getUser(socket.id);
    if (!user) return;

    const room = roomManager.createRoom(roomId, {
      password,
      maxUsers: maxUsers || 4,
      owner: socket.id,
    });

    if (!room) {
      socket.emit("error", { type: "roomExists", message: "Room already exists" });
      return;
    }

    socket.join(roomId);
    userManager.updateUserRoom(socket.id, roomId);

    socket.emit("roomCreated", {
      roomId: room.id,
      owner: room.owner,
      maxUsers: room.maxUsers,
    });

    // Emit simplified room list for frontend consistency
    const roomsList = roomManager.getAllRooms().map((r) => {
      const owner = userManager.getUser(r.owner);
      return {
        id: r.id,
        owner: owner?.username,
        userCount: r.users.length,
        maxUsers: r.maxUsers,
      };
    });

    io.emit("roomListUpdated", roomsList);
    io.emit("onlineUsers", userManager.getOnlineUsers());

    console.log(`Room created: ${roomId} by ${user.username}`);
  });

  // Join Room
  socket.on("joinRoom", ({ roomId, password }) => {
    const user = userManager.getUser(socket.id);
    if (!user) return;

    const room = roomManager.getRoom(roomId);
    if (!room) {
      socket.emit("error", { type: "roomNotFound", message: "Room not found" });
      return;
    }

    if (room.password !== password) {
      socket.emit("error", { type: "wrongPassword", message: "Wrong password" });
      return;
    }

    if (!roomManager.joinRoom(roomId, socket.id)) {
      socket.emit("error", {
        type: "roomFull",
        message: "Room is full",
      });
      return;
    }

    socket.join(roomId);
    userManager.updateUserRoom(socket.id, roomId);

    socket.emit("joinedRoom", {
      roomId: room.id,
      users: room.users,
      owner: room.owner,
    });

    // Notify room members
    io.to(roomId).emit("userJoinedRoom", {
      userId: socket.id,
      username: user.username,
      avatar: user.avatar,
      users: room.users,
    });

    // Emit simplified room list for frontend consistency
    const roomsList = roomManager.getAllRooms().map((r) => {
      const owner = userManager.getUser(r.owner);
      return {
        id: r.id,
        owner: owner?.username,
        userCount: r.users.length,
        maxUsers: r.maxUsers,
      };
    });

    io.emit("roomListUpdated", roomsList);
    io.emit("onlineUsers", userManager.getOnlineUsers());

    console.log(`${user.username} joined room: ${roomId}`);
  });

  // Leave Room
  socket.on("leaveRoom", ({ roomId }) => {
    const user = userManager.getUser(socket.id);
    if (!user) return;

    const result = roomManager.leaveRoom(roomId, socket.id);
    if (result) {
      socket.leave(roomId);
      userManager.updateUserRoom(socket.id, null);

      if (result === "deleted") {
        io.emit("roomDeleted", { roomId });
        console.log(`Room deleted: ${roomId}`);
      } else {
        io.to(roomId).emit("userLeftRoom", {
          userId: socket.id,
          username: user.username,
          users: roomManager.getRoomUsers(roomId),
        });
      }

      // Emit simplified room list for frontend consistency
      const roomsList = roomManager.getAllRooms().map((r) => {
        const owner = userManager.getUser(r.owner);
        return {
          id: r.id,
          owner: owner?.username,
          userCount: r.users.length,
          maxUsers: r.maxUsers,
        };
      });

      io.emit("roomListUpdated", roomsList);
      io.emit("onlineUsers", userManager.getOnlineUsers());

      console.log(`${user.username} left room: ${roomId}`);
    }
  });

  // Get Room Info
  socket.on("getRoomInfo", ({ roomId }) => {
    const room = roomManager.getRoom(roomId);
    if (!room) {
      socket.emit("error", { type: "roomNotFound", message: "Room not found" });
      return;
    }

    const roomUsers = room.users.map((userId) => {
      const user = userManager.getUser(userId);
      return {
        id: userId,
        username: user?.username,
        avatar: user?.avatar,
      };
    });

    socket.emit("roomInfo", {
      id: room.id,
      owner: room.owner,
      users: roomUsers,
      maxUsers: room.maxUsers,
      messages: room.messages,
    });
  });

  // Get All Rooms
  socket.on("getAllRooms", () => {
    const rooms = roomManager.getAllRooms().map((room) => {
      const owner = userManager.getUser(room.owner);
      return {
        id: room.id,
        owner: owner?.username,
        userCount: room.users.length,
        maxUsers: room.maxUsers,
      };
    });

    socket.emit("roomList", rooms);
  });
}

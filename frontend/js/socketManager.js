// Socket.IO Manager
class SocketManager {
  constructor() {
    this.socket = null;
  }

  connect() {
    this.socket = io(CONFIG.SOCKET_URL, {
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
    });

    this.setupConnectionHandlers();
    this.setupChatHandlers();
    this.setupRoomHandlers();
    this.setupWebRTCHandlers();
    this.setupPresenceHandlers();
  }

  setupConnectionHandlers() {
    this.socket.on("connect", () => {
      console.log("✓ Connected to server", this.socket.id);
      UI.showNotification("Connected to platform", "success");
    });

    this.socket.on("disconnect", () => {
      console.log("✗ Disconnected from server");
      UI.showNotification("Disconnected from platform", "error");
    });

    this.socket.on("connected", (data) => {
      USER_STATE.id = data.userId;
      console.log("✓ User registered:", data.username);
    });

    this.socket.on("error", (error) => {
      console.error("Socket error:", error);
      UI.showNotification(error.message || "An error occurred", "error");
    });
  }

  setupChatHandlers() {
    this.socket.on("chatMessage", (data) => {
      console.log("📨 Global message:", data);
      UI.addGlobalMessage(data);
    });

    this.socket.on("roomChatMessage", (data) => {
      console.log("📨 Room message:", data);
      UI.addRoomMessage(data);
    });

    this.socket.on("userTyping", (data) => {
      UI.showTypingIndicator(data.username);
    });

    this.socket.on("userStoppedTyping", () => {
      UI.hideTypingIndicator();
    });
  }

  setupRoomHandlers() {
    this.socket.on("roomCreated", (data) => {
      console.log("✓ Room created:", data.roomId);
      USER_STATE.currentRoom = data.roomId;
      document.getElementById("currentRoomTitle").textContent = `Room: ${data.roomId}`;
      UI.showNotification(`Room "${data.roomId}" created!`, "success");
      UI.switchView("currentRoom");
    });

    this.socket.on("joinedRoom", (data) => {
      console.log("✓ Joined room:", data.roomId);
      USER_STATE.currentRoom = data.roomId;
      document.getElementById("currentRoomTitle").textContent = `Room: ${data.roomId}`;
      UI.showNotification(`Joined room "${data.roomId}"`, "success");
      UI.switchView("currentRoom");
      UI.updateRoomUsers(data.users);
    });

    this.socket.on("userJoinedRoom", async (data) => {
      console.log("User joined:", data.username);
      UI.addRoomSystemMessage(`${data.username} joined the room`);
      UI.updateRoomUsers(data.users);
      
      // Initiate WebRTC connection to the newly joined user if we are already in the room
      if (data.userId !== USER_STATE.id) {
        WebRTC.createPeerConnection(data.userId);
        await WebRTC.createOffer(data.userId);
      }
    });

    this.socket.on("userLeftRoom", (data) => {
      console.log("User left:", data.username);
      UI.addRoomSystemMessage(`${data.username} left the room`);
      if (data.users) {
        UI.updateRoomUsers(data.users);
      }
      WebRTC.closePeerConnection(data.userId);
    });

    this.socket.on("roomListUpdated", (rooms) => {
      console.log("📋 Rooms updated:", rooms.length);
      APP_STATE.availableRooms = rooms;
      UI.updateRoomsList(rooms);
    });

    // Response to a direct getAllRooms() request
    this.socket.on("roomList", (rooms) => {
      console.log("📋 Room list (direct):", rooms.length);
      APP_STATE.availableRooms = rooms;
      UI.updateRoomsList(rooms);
    });

    this.socket.on("roomDeleted", (data) => {
      console.log("✗ Room deleted:", data.roomId);
      if (USER_STATE.currentRoom === data.roomId) {
        UI.switchView("lobby");
        UI.showNotification("Room was deleted", "info");
      }
    });

    this.socket.on("roomInfo", (data) => {
      console.log("📋 Room info:", data.id);
      document.getElementById("currentRoomTitle").textContent = `Room: ${data.id}`;
      UI.updateRoomUsers(data.users.map(u => u.id));
    });
  }

  setupWebRTCHandlers() {
    this.socket.on("incomingCall", async (data) => {
      console.log("📞 Incoming call from:", data.fromUsername);
      UI.showIncomingCallModal(data);
    });

    this.socket.on("callAccepted", (data) => {
      console.log("✓ Call accepted");
      this.setupWebRTCConnection(data.to);
    });

    this.socket.on("callRejected", (data) => {
      console.log("✗ Call rejected");
      WebRTC.closePeerConnection(data.from);
      UI.showNotification("Call was rejected", "info");
    });

    this.socket.on("callEnded", (data) => {
      console.log("✗ Call ended");
      WebRTC.closePeerConnection(data.from);
      UI.showNotification("Call ended", "info");
    });

    this.socket.on("webrtcOffer", async (data) => {
      console.log("📨 WebRTC Offer from:", data.fromUsername);
      await WebRTC.handleOffer(data.from, data.offer);
    });

    this.socket.on("webrtcAnswer", async (data) => {
      console.log("📨 WebRTC Answer from:", data.fromUsername);
      await WebRTC.handleAnswer(data.from, data.answer);
    });

    this.socket.on("iceCandidate", async (data) => {
      console.log("🧊 ICE Candidate from:", data.from);
      await WebRTC.addIceCandidate(data.from, data.candidate);
    });
  }

  setupPresenceHandlers() {
    this.socket.on("onlineUsers", (users) => {
      console.log("👥 Online users updated:", users.length);
      APP_STATE.onlineUsers = users;
      UI.updateOnlineUsers(users);
      UI.updateUserBadge(users.length);
    });

    this.socket.on("userOnline", (data) => {
      console.log("🟢 User online:", data.username);
      UI.addUserToList(data);
    });

    this.socket.on("userOffline", (data) => {
      console.log("🔴 User offline:", data.username);
      UI.removeUserFromList(data.userId);
    });

    this.socket.on("onlineCount", (count) => {
      UI.updateParticipantCount(count);
    });
  }

  // Emit Methods
  joinPlatform(userData) {
    this.socket.emit("userJoined", userData);
  }

  sendGlobalMessage(message) {
    this.socket.emit("chatMessage", { message });
  }

  sendRoomMessage(roomId, message) {
    this.socket.emit("roomChatMessage", { roomId, message });
  }

  sendTyping(roomId = null) {
    this.socket.emit("typing", {
      roomId,
      username: USER_STATE.username,
    });
  }

  stopTyping(roomId = null) {
    this.socket.emit("stopTyping", { roomId });
  }

  createRoom(roomId, password, maxUsers = 4) {
    this.socket.emit("createRoom", { roomId, password, maxUsers });
  }

  joinRoom(roomId, password) {
    if (USER_STATE.currentRoom && USER_STATE.currentRoom !== roomId) {
      this.leaveRoom(USER_STATE.currentRoom);
      WebRTC.closeAllConnections();
    }
    this.socket.emit("joinRoom", { roomId, password });
  }

  leaveRoom(roomId) {
    this.socket.emit("leaveRoom", { roomId });
    USER_STATE.currentRoom = null;
  }

  getRoomInfo(roomId) {
    this.socket.emit("getRoomInfo", { roomId });
  }

  getAllRooms() {
    this.socket.emit("getAllRooms");
  }

  getOnlineUsers() {
    this.socket.emit("getOnlineUsers");
  }

  // WebRTC Signaling
  sendOffer(roomId, to, offer) {
    this.socket.emit("webrtcOffer", { roomId, to, offer });
  }

  sendAnswer(roomId, to, answer) {
    this.socket.emit("webrtcAnswer", { roomId, to, answer });
  }

  sendIceCandidate(roomId, to, candidate) {
    this.socket.emit("iceCandidate", { roomId, to, candidate });
  }

  callUser(roomId, targetUserId) {
    this.socket.emit("callUser", { roomId, targetUserId });
  }

  acceptCall(from, roomId) {
    this.socket.emit("callAccepted", { from, roomId });
  }

  rejectCall(from) {
    this.socket.emit("callRejected", { from });
  }

  endCall(roomId, targetUserId) {
    this.socket.emit("endCall", { roomId, targetUserId });
  }
}

// Create instance
const SocketIO = new SocketManager();

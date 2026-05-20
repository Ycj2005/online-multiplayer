// Main Application
class ChorusHub {
  constructor() {
    this.initialized = false;
  }

  async init() {
    try {
      console.log("🚀 Initializing ChorusHub...");

      // Connect to Socket.IO
      SocketIO.connect();
      APP_STATE.socket = SocketIO.socket;

      // Wait for connection
      await this.waitForConnection();

      // Initialize local media when user enters
      document.getElementById("authForm").addEventListener(
        "submit",
        async (e) => {
          e.preventDefault();
          await this.handleAuthSubmit();
        },
        { once: true }
      );

      this.initialized = true;
      console.log("✓ ChorusHub initialized");
    } catch (error) {
      console.error("✗ Initialization error:", error);
      UI.showNotification("Failed to initialize application", "error");
    }
  }

  async waitForConnection() {
    return new Promise((resolve) => {
      if (SocketIO.socket && SocketIO.socket.connected) {
        resolve();
      } else {
        SocketIO.socket.once("connect", resolve);
      }
    });
  }

  async handleAuthSubmit() {
    try {
      // Get username
      const username = document.getElementById("usernameInput").value.trim();
      if (!username) return;

      USER_STATE.username = username;
      const initials = username
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);
      USER_STATE.avatar = initials;

      // Initialize local media
      const stream = await WebRTC.initLocalMedia();
      await WebRTC.displayLocalVideo(stream);

      // Join platform
      SocketIO.joinPlatform({
        username,
        avatar: initials,
      });

      // Show app
      UI.showApp();
    } catch (error) {
      console.error("✗ Auth error:", error);
      UI.showNotification("Failed to access camera/microphone", "error");
    }
  }

  // Room Methods
  async createRoom(roomId, password, maxUsers) {
    SocketIO.createRoom(roomId, password, maxUsers);
  }

  async joinRoom(roomId) {
    // Show join modal
    UI.openModal("joinRoomModal");
    document.getElementById("joinRoomId").value = roomId;
  }

  async leaveRoom() {
    if (USER_STATE.currentRoom) {
      SocketIO.leaveRoom(USER_STATE.currentRoom);
      WebRTC.closeAllConnections();
      UI.switchView("lobby");
    }
  }

  // Call Methods
  async initiateCall(targetUserId) {
    try {
      SocketIO.callUser(USER_STATE.currentRoom, targetUserId);
      UI.showNotification("Calling user...", "info");
    } catch (error) {
      console.error("Call error:", error);
      UI.showNotification("Failed to initiate call", "error");
    }
  }

  async endCall(targetUserId) {
    SocketIO.endCall(USER_STATE.currentRoom, targetUserId);
    WebRTC.closeAllConnections();
  }

  // Cleanup
  async cleanup() {
    console.log("🧹 Cleaning up ChorusHub...");

    if (USER_STATE.currentRoom) {
      SocketIO.leaveRoom(USER_STATE.currentRoom);
    }

    WebRTC.cleanup();
    SocketIO.socket.disconnect();
  }
}

// Create global instance
const app = new ChorusHub();

// Initialize on load
document.addEventListener("DOMContentLoaded", async () => {
  await app.init();
});

// Cleanup on unload
window.addEventListener("beforeunload", () => {
  app.cleanup();
});

// Prevent accidental data loss
window.addEventListener("beforeunload", (e) => {
  if (USER_STATE.currentRoom) {
    e.preventDefault();
    e.returnValue = "";
    return "";
  }
});

// Handle visibility change
document.addEventListener("visibilitychange", () => {
  if (document.hidden) {
    console.log("👁️ App hidden");
  } else {
    console.log("👁️ App visible");
  }
});

console.log(
  "%c🎮 ChorusHub - Real-time Multiplayer Communication Platform",
  "color: #6366f1; font-size: 16px; font-weight: bold;"
);
console.log(
  "%cVersion 1.0.0 | Built with Node.js, Express, Socket.IO, and WebRTC",
  "color: #8b5cf6; font-size: 12px;"
);

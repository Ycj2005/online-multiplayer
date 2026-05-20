// UI Manager
class UIManager {
  constructor() {
    this.setupEventListeners();
  }

  setupEventListeners() {
    // Mobile Hamburger Menu
    const hamburger = document.getElementById("hamburgerBtn");
    const sidebar = document.querySelector(".sidebar");
    const overlay = document.getElementById("sidebarOverlay");

    if (hamburger) {
      hamburger.addEventListener("click", () => {
        sidebar.classList.toggle("open");
        overlay.classList.toggle("active");
      });
    }
    if (overlay) {
      overlay.addEventListener("click", () => {
        sidebar.classList.remove("open");
        overlay.classList.remove("active");
      });
    }

    // Auth Form
    document.getElementById("authForm").addEventListener("submit", (e) => {
      e.preventDefault();
      this.handleAuth();
    });

    // Navigation
    document.querySelectorAll(".nav-item").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const view = e.currentTarget.dataset.view;
        this.switchView(view);
        // Close mobile sidebar
        sidebar.classList.remove("open");
        overlay.classList.remove("active");
      });
    });

    // Global Chat
    document
      .getElementById("globalChatForm")
      .addEventListener("submit", (e) => {
        e.preventDefault();
        const input = document.getElementById("globalChatInput");
        if (input.value.trim()) {
          SocketIO.sendGlobalMessage(input.value.trim());
          input.value = "";
          SocketIO.stopTyping();
        }
      });

    document.getElementById("globalChatInput").addEventListener("input", () => {
      SocketIO.sendTyping();
    });

    // Room Chat
    document.getElementById("roomChatForm").addEventListener("submit", (e) => {
      e.preventDefault();
      const input = document.getElementById("roomChatInput");
      if (input.value.trim() && USER_STATE.currentRoom) {
        SocketIO.sendRoomMessage(USER_STATE.currentRoom, input.value.trim());
        input.value = "";
        SocketIO.stopTyping(USER_STATE.currentRoom);
      }
    });

    document.getElementById("roomChatInput").addEventListener("input", () => {
      SocketIO.sendTyping(USER_STATE.currentRoom);
    });

    // Create Room
    document.getElementById("createRoomBtn").addEventListener("click", () => {
      this.openModal("createRoomModal");
    });

    document
      .getElementById("createRoomForm")
      .addEventListener("submit", (e) => {
        e.preventDefault();
        const roomId = document.getElementById("roomIdInput").value;
        const password = document.getElementById("roomPasswordInput").value;
        const maxUsers = document.getElementById("maxUsersInput").value;

        SocketIO.createRoom(roomId, password, maxUsers);
        this.closeModal("createRoomModal");
      });

    // Leave Room
    document.getElementById("leaveRoomBtn").addEventListener("click", () => {
      if (USER_STATE.currentRoom) {
        SocketIO.leaveRoom(USER_STATE.currentRoom);
        WebRTC.closeAllConnections();
        this.switchView("lobby");
      }
    });

    // Join Room Form
    document.getElementById("joinRoomForm").addEventListener("submit", (e) => {
      e.preventDefault();
      const roomId = document.getElementById("joinRoomId").value;
      const password = document.getElementById("joinPasswordInput").value;

      SocketIO.joinRoom(roomId, password);
      this.closeModal("joinRoomModal");
    });

    // Video Controls
    document.getElementById("toggleVideoBtn").addEventListener("click", () => {
      const newState = !USER_STATE.isVideoEnabled;
      WebRTC.toggleVideo(newState);
      this.updateVideoControlButton(newState);
    });

    document.getElementById("toggleAudioBtn").addEventListener("click", () => {
      const newState = !USER_STATE.isAudioEnabled;
      WebRTC.toggleAudio(newState);
      this.updateAudioControlButton(newState);
    });

    // Settings & Logout
    document.getElementById("settingsBtn").addEventListener("click", () => {
      this.showNotification("Settings coming soon!", "info");
    });

    document.getElementById("logoutBtn").addEventListener("click", () => {
      location.reload();
    });

    // Modals
    document.querySelectorAll(".modal-close").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.currentTarget.closest(".modal").classList.remove("active");
      });
    });

    document.querySelectorAll(".modal-close-btn").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.currentTarget.closest(".modal").classList.remove("active");
      });
    });

    // Incoming Call
    document.getElementById("acceptCallBtn").addEventListener("click", () => {
      this.acceptIncomingCall();
    });

    document.getElementById("rejectCallBtn").addEventListener("click", () => {
      this.rejectIncomingCall();
    });
  }

  // Authentication
  handleAuth() {
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

    SocketIO.joinPlatform({
      username,
      avatar: initials,
    });

    this.showApp();
  }

  showApp() {
    document.getElementById("authModal").classList.remove("active");
    document.getElementById("app").classList.remove("hidden");
    document.getElementById("currentUsername").textContent =
      USER_STATE.username;
    document.getElementById("userAvatar").textContent = USER_STATE.avatar;
  }

  // View Management
  switchView(viewName) {
    // Update navigation
    document.querySelectorAll(".nav-item").forEach((btn) => {
      btn.classList.toggle("active", btn.dataset.view === viewName);
    });

    // Show/hide views
    const views = {
      lobby: "lobbyView",
      rooms: "roomsView",
      friends: "friendsView",
      currentRoom: "currentRoomView",
    };

    Object.values(views).forEach((viewId) => {
      document.getElementById(viewId).classList.remove("active");
    });

    if (views[viewName]) {
      document.getElementById(views[viewName]).classList.add("active");
      APP_STATE.currentView = viewName;

      if (viewName === "rooms") {
        SocketIO.getAllRooms();
      } else if (viewName === "currentRoom" && USER_STATE.currentRoom) {
        SocketIO.getRoomInfo(USER_STATE.currentRoom);
      }
    }
  }

  // Chat Messages
  addGlobalMessage(data) {
    const container = document.getElementById("globalChatMessages");
    const isOwn = data.userId === USER_STATE.id;

    const messageEl = document.createElement("div");
    messageEl.className = `message ${isOwn ? "own" : ""}`;
    messageEl.innerHTML = `
      <div class="message-avatar">${data.avatar}</div>
      <div class="message-content">
        <div class="message-bubble">
          <strong>${data.username}</strong>
          <p>${this.escapeHtml(data.message)}</p>
        </div>
        <div class="message-meta">${this.formatTime(data.timestamp)}</div>
      </div>
    `;

    container.appendChild(messageEl);
    container.scrollTop = container.scrollHeight;
  }

  addRoomMessage(data) {
    const container = document.getElementById("roomChatMessages");
    const isOwn = data.userId === USER_STATE.id;

    const messageEl = document.createElement("div");
    messageEl.className = `message ${isOwn ? "own" : ""}`;
    messageEl.innerHTML = `
      <div class="message-avatar">${data.avatar}</div>
      <div class="message-content">
        <div class="message-bubble">
          <strong>${data.username}</strong>
          <p>${this.escapeHtml(data.message)}</p>
        </div>
        <div class="message-meta">${this.formatTime(data.timestamp)}</div>
      </div>
    `;

    container.appendChild(messageEl);
    container.scrollTop = container.scrollHeight;
  }

  addRoomSystemMessage(message) {
    const container = document.getElementById("roomChatMessages");
    const messageEl = document.createElement("div");
    messageEl.className = "message-system";
    messageEl.innerHTML = `<p>${message}</p>`;
    container.appendChild(messageEl);
    container.scrollTop = container.scrollHeight;
  }

  showTypingIndicator(username) {
    const indicator = document.getElementById("typingIndicator");
    document.getElementById("typingUser").textContent =
      `${username} is typing...`;
    indicator.style.display = "flex";
  }

  hideTypingIndicator() {
    document.getElementById("typingIndicator").style.display = "none";
  }

  // Online Users
  updateOnlineUsers(users) {
    const container = document.getElementById("onlineUsersList");
    container.innerHTML = users
      .map((user) => this.createUserElement(user))
      .join("");
  }

  updateRoomUsers(userIds) {
    const container = document.getElementById("roomUsersList");
    // Note: You might need to pass full user objects or fetch them from APP_STATE
    container.innerHTML = userIds
      .map((userId) => {
        const user = APP_STATE.onlineUsers.find((u) => u.id === userId);
        return user ? this.createUserElement(user) : "";
      })
      .join("");
  }

  addUserToList(user) {
    const container = document.getElementById("onlineUsersList");
    const userEl = this.createUserElement(user);
    container.insertAdjacentHTML("beforeend", userEl);
    this.updateAllUsersList();
  }

  removeUserFromList(userId) {
    document.querySelectorAll(`[data-user-id="${userId}"]`).forEach((el) => {
      el.remove();
    });
    this.updateAllUsersList();
  }

  updateAllUsersList() {
    const container = document.getElementById("allUsersList");
    container.innerHTML = APP_STATE.onlineUsers
      .map((user) => this.createUserElement(user))
      .join("");
  }

  createUserElement(user) {
    return `
      <div class="user-item online" data-user-id="${user.id}">
        <div class="user-info">
          <div class="user-name">${user.username}</div>
          <div class="user-status">Online</div>
        </div>
      </div>
    `;
  }

  updateUserBadge(count) {
    document.getElementById("userBadge").textContent = count;
  }

  updateParticipantCount(count) {
    document.getElementById("participantCount").textContent = count;
  }

  // Rooms
  updateRoomsList(rooms) {
    const container = document.getElementById("roomsList");

    if (!rooms || rooms.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <p>📭 No rooms available</p>
          <p class="small">Create one to get started!</p>
        </div>
      `;
      document.getElementById("roomBadge").textContent = "0";
      return;
    }

    container.innerHTML = rooms
      .map((room) => this.createRoomCard(room))
      .join("");
    document.getElementById("roomBadge").textContent = rooms.length;
  }

  createRoomCard(room) {
    const userCount = room.userCount ?? (room.users ? room.users.length : 0);
    const maxUsers = room.maxUsers ?? 4;
    const owner = room.owner || "Unknown";
    const isFull = userCount >= maxUsers;

    return `
      <div class="room-card">
        <div class="room-name">🚪 ${room.id}</div>
        <div class="room-owner">by ${owner}</div>
        <div class="room-stats">
          <span>👥 ${userCount}/${maxUsers}</span>
        </div>
        <div class="room-actions">
          ${
            isFull
              ? `<button class="btn btn-ghost" disabled>Full</button>`
              : `<button class="btn btn-primary" onclick="app.joinRoom('${room.id}')">Join</button>`
          }
        </div>
      </div>
    `;
  }

  async joinRoom(roomId) {
    this.openModal("joinRoomModal");
    document.getElementById("joinRoomId").value = roomId;
    document.getElementById("joinPasswordInput").focus();
  }

  // Video
  // Video
  async displayRemoteVideo(peerId, stream) {
    let videoContainer = document.querySelector(`[data-peer-id="${peerId}"]`);

    // Create new container if not exists
    if (!videoContainer) {
      const grid = document.getElementById("videoGrid");

      videoContainer = document.createElement("div");

      videoContainer.className = "video-container remote";

      videoContainer.setAttribute("data-peer-id", peerId);

      videoContainer.innerHTML = `
      <video autoplay playsinline></video>
      <div class="video-label">
        ${peerId.slice(0, 8)}
      </div>
    `;

      grid.appendChild(videoContainer);
    }

    // Get video element
    const video = videoContainer.querySelector("video");

    // Prevent unnecessary reassignment
    if (video.srcObject !== stream) {
      video.srcObject = stream;
    }

    // Force play
    try {
      await video.play();
    } catch (err) {
      console.log("Autoplay prevented:", err);
    }
  }
  removeRemoteVideo(peerId) {
    const container = document.querySelector(`[data-peer-id="${peerId}"]`);
    if (container) {
      container.remove();
    }
  }

  updateVideoControlButton(enabled) {
    const btn = document.getElementById("toggleVideoBtn");
    btn.classList.toggle("disabled", !enabled);
    btn.textContent = enabled ? "📹" : "📹❌";
  }

  updateAudioControlButton(enabled) {
    const btn = document.getElementById("toggleAudioBtn");
    btn.classList.toggle("disabled", !enabled);
    btn.textContent = enabled ? "🎤" : "🎤❌";
  }

  // Incoming Call
  showIncomingCallModal(data) {
    const modal = document.getElementById("incomingCallModal");
    document.getElementById("callerName").textContent = data.fromUsername;
    document.getElementById("callerAvatar").textContent = data.fromAvatar;

    // Store caller info for accept/reject
    modal.dataset.fromId = data.from;
    modal.dataset.roomId = data.roomId;

    modal.classList.add("active");
  }

  async acceptIncomingCall() {
    const modal = document.getElementById("incomingCallModal");
    const from = modal.dataset.fromId;
    const roomId = modal.dataset.roomId;

    SocketIO.acceptCall(from, roomId);
    modal.classList.remove("active");

    // Create peer connection and send offer
    WebRTC.createPeerConnection(from);
    await WebRTC.createOffer(from);
  }

  rejectIncomingCall() {
    const modal = document.getElementById("incomingCallModal");
    const from = modal.dataset.fromId;

    SocketIO.rejectCall(from);
    modal.classList.remove("active");
  }

  // Modals
  openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.classList.add("active");
    }
  }

  closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.classList.remove("active");
    }
  }

  // Notifications
  showNotification(message, type = "info") {
    const notification = document.getElementById("notification");
    notification.textContent = message;
    notification.className = `notification show ${type}`;

    setTimeout(() => {
      notification.classList.remove("show");
    }, 4000);
  }

  // Utilities
  formatTime(date) {
    const d = new Date(date);
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }

  escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  }
}

// Create instance
const UI = new UIManager();

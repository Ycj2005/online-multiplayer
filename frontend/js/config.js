// Configuration
const CONFIG = {
  // Auto-detect: use current host in production, localhost in dev
  SOCKET_URL: window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1"
    ? "http://localhost:3000"
    : window.location.origin,
  
  // WebRTC Configuration
  ICE_SERVERS: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
  ],

  // Media Constraints
  MEDIA_CONSTRAINTS: {
    audio: {
      echoCancellation: true,
      noiseSuppression: true,
      autoGainControl: true,
    },
    video: {
      width: { ideal: 1280 },
      height: { ideal: 720 },
      facingMode: "user",
    },
  },

  // Message Types
  MESSAGE_TYPES: {
    MESSAGE: "message",
    SYSTEM: "system",
    NOTIFICATION: "notification",
  },
};

// User State
const USER_STATE = {
  id: null,
  username: "",
  avatar: "",
  currentRoom: null,
  isVideoEnabled: true,
  isAudioEnabled: true,
};

// App State
const APP_STATE = {
  socket: null,
  localStream: null,
  peerConnections: {},
  remoteStreams: {},
  currentView: "lobby",
  typingTimeouts: {},
  onlineUsers: [],
  availableRooms: [],
};

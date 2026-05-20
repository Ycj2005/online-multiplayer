const socket = io("http://localhost:3000");

let currentRoom = null;

// DOM
const authForm = document.getElementById("authForm");

const usernameInput = document.getElementById("usernameInput");

const authModal = document.getElementById("authModal");

const app = document.getElementById("app");

const createRoomBtn = document.getElementById("createRoomBtn");

const createRoomModal = document.getElementById("createRoomModal");

const createRoomForm = document.getElementById("createRoomForm");

const joinRoomModal = document.getElementById("joinRoomModal");

const joinRoomForm = document.getElementById("joinRoomForm");

const roomsList = document.getElementById("roomsList");

const currentRoomTitle = document.getElementById("currentRoomTitle");

// USER LOGIN
authForm.addEventListener("submit", (e) => {
  e.preventDefault();

  const username = usernameInput.value.trim();

  if (!username) return;

  authModal.classList.remove("active");

  app.classList.remove("hidden");

  document.getElementById("currentUsername").textContent = username;
});

// OPEN CREATE ROOM MODAL
createRoomBtn.addEventListener("click", () => {
  createRoomModal.classList.add("active");
});

// CREATE ROOM
createRoomForm.addEventListener("submit", (e) => {
  e.preventDefault();

  const roomId = document.getElementById("roomIdInput").value;

  const password = document.getElementById("roomPasswordInput").value;

  socket.emit("createRoom", {
    roomId,
    password,
  });
});

// ROOM CREATED
socket.on("roomCreated", async (roomId) => {
  currentRoom = roomId;

  createRoomModal.classList.remove("active");

  document.getElementById("currentRoomView").classList.add("active");

  currentRoomTitle.textContent = `Room: ${roomId}`;

  // START CAMERA
  await WebRTC.initLocalMedia();

  WebRTC.displayLocalVideo(WebRTC.localStream);

  console.log("Room created");
});

// JOIN ROOM BUTTON
function createJoinButton(roomId) {
  const btn = document.createElement("button");

  btn.textContent = `Join ${roomId}`;

  btn.onclick = () => {
    joinRoomModal.classList.add("active");

    document.getElementById("joinRoomId").value = roomId;
  };

  return btn;
}

// JOIN ROOM
joinRoomForm.addEventListener("submit", (e) => {
  e.preventDefault();

  const roomId = document.getElementById("joinRoomId").value;

  const password = document.getElementById("joinPasswordInput").value;

  socket.emit("joinRoom", {
    roomId,
    password,
  });
});

// JOINED ROOM
socket.on("joinedRoom", async (roomId) => {
  currentRoom = roomId;

  joinRoomModal.classList.remove("active");

  document.getElementById("currentRoomView").classList.add("active");

  currentRoomTitle.textContent = `Room: ${roomId}`;

  console.log("Joined room");
});

// EXISTING USERS
socket.on("existingUsers", async (users) => {
  console.log("Existing users:", users);

  // START CAMERA
  if (!WebRTC.localStream) {
    await WebRTC.initLocalMedia();

    WebRTC.displayLocalVideo(WebRTC.localStream);
  }

  // CONNECT TO USERS
  for (const userId of users) {
    WebRTC.createPeerConnection(userId);

    await WebRTC.createOffer(userId);
  }
});

// NEW USER JOINED
socket.on("userJoined", async ({ userId }) => {
  console.log("User joined:", userId);

  WebRTC.createPeerConnection(userId);
});

// RECEIVE OFFER
socket.on("webrtcOffer", async ({ from, offer }) => {
  console.log("Offer received:", from);

  if (!WebRTC.localStream) {
    await WebRTC.initLocalMedia();

    WebRTC.displayLocalVideo(WebRTC.localStream);
  }

  await WebRTC.handleOffer(from, offer);
});

// RECEIVE ANSWER
socket.on("webrtcAnswer", async ({ from, answer }) => {
  console.log("Answer received:", from);

  await WebRTC.handleAnswer(from, answer);
});

// RECEIVE ICE
socket.on("iceCandidate", async ({ from, candidate }) => {
  await WebRTC.addIceCandidate(from, candidate);
});

// ERROR
socket.on("errorMessage", (msg) => {
  alert(msg);
});

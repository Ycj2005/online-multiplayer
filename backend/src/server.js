import express from "express";
import http from "http";
import { Server } from "socket.io";
import path from "path";
import { fileURLToPath } from "url";

// Import managers
import UserManager from "./managers/UserManager.js";
import RoomManager from "./managers/RoomManager.js";

// Import handlers
import { setupConnectionHandlers } from "./handlers/connectionHandlers.js";
import { setupRoomHandlers } from "./handlers/roomHandlers.js";
import { setupChatHandlers } from "./handlers/chatHandlers.js";
import { setupWebRTCHandlers } from "./handlers/webrtcHandlers.js";

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
  },
});

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(express.static(path.join(__dirname, "../../frontend")));

// Initialize managers
const userManager = new UserManager();
const roomManager = new RoomManager();

io.on("connection", (socket) => {
  console.log("New connection:", socket.id);

  // Send initial online count
  io.emit("onlineCount", io.engine.clientsCount);

  socket.on("disconnect", () => {
    io.emit("onlineCount", io.engine.clientsCount);
  });

  // Setup modular handlers
  setupConnectionHandlers(io, socket, userManager, roomManager);
  setupRoomHandlers(io, socket, userManager, roomManager);
  setupChatHandlers(io, socket, userManager, roomManager);
  setupWebRTCHandlers(io, socket, userManager, roomManager);
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

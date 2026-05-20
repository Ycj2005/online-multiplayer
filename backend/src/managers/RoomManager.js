// Room Management System
class RoomManager {
  constructor() {
    this.rooms = new Map();
  }

  createRoom(roomId, { password, maxUsers = 4, owner }) {
    if (this.rooms.has(roomId)) {
      return null;
    }

    this.rooms.set(roomId, {
      id: roomId,
      password,
      owner,
      maxUsers,
      users: [owner],
      createdAt: Date.now(),
      messages: [],
    });

    return this.rooms.get(roomId);
  }

  deleteRoom(roomId) {
    return this.rooms.delete(roomId);
  }

  getRoom(roomId) {
    return this.rooms.get(roomId);
  }
  joinRoom(roomId, userId) {
    const room = this.rooms.get(roomId);
    if (!room) return false;

    if (room.users.length >= room.maxUsers) return false;
    if (room.users.includes(userId)) return false;

    room.users.push(userId);
    return true;
  }

  leaveRoom(roomId, userId) {
    const room = this.rooms.get(roomId);
    if (!room) return false;

    room.users = room.users.filter((id) => id !== userId);

    // Delete room if empty
    if (room.users.length === 0) {
      this.deleteRoom(roomId);
      return "deleted";
    }

    // Transfer ownership if owner left
    if (room.owner === userId && room.users.length > 0) {
      room.owner = room.users[0];
      return "owner_changed";
    }

    return true;
  }

  addMessage(roomId, message) {
    const room = this.rooms.get(roomId);
    if (room) {
      room.messages.push(message);
      // Keep only last 100 messages
      if (room.messages.length > 100) {
        room.messages.shift();
      }
    }
  }

  getRoomMessages(roomId) {
    const room = this.rooms.get(roomId);
    return room ? room.messages : [];
  }

  getAllRooms() {
    return Array.from(this.rooms.values());
  }

  getRoomUsers(roomId) {
    const room = this.rooms.get(roomId);
    return room ? room.users : [];
  }
}

export default RoomManager;

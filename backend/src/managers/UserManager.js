// User Management System
class UserManager {
  constructor() {
    this.users = new Map();
  }

  addUser(socketId, userData) {
    this.users.set(socketId, {
      id: socketId,
      username: userData.username,
      avatar: userData.avatar,
      currentRoom: null,
      isOnline: true,
      connectedAt: Date.now(),
    });
  }

  removeUser(socketId) {
    this.users.delete(socketId);
  }

  getUser(socketId) {
    return this.users.get(socketId);
  }

  updateUserRoom(socketId, roomId) {
    const user = this.users.get(socketId);
    if (user) {
      user.currentRoom = roomId;
    }
  }

  getAllUsers() {
    return Array.from(this.users.values());
  }

  getUsersByRoom(roomId) {
    return Array.from(this.users.values()).filter(
      (user) => user.currentRoom === roomId
    );
  }

  getOnlineUsers() {
    return Array.from(this.users.values()).filter((user) => user.isOnline);
  }
}

export default UserManager;

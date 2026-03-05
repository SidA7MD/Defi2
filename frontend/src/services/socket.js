import { io } from 'socket.io-client';

const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || '';

class SocketService {
  constructor() {
    this.socket = null;
    this.listeners = new Map();
  }

  connect() {
    if (this.socket?.connected) return;

    this.socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
    });

    this.socket.on('connect', () => {
      console.log('Socket connected:', this.socket.id);
    });

    this.socket.on('disconnect', () => {
      console.log('Socket disconnected');
    });

    this.socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error.message);
    });
  }

  joinRooms(user) {
    if (!this.socket?.connected) return;

    const rooms = { userId: user.id };
    if (user.role === 'VALIDATOR') rooms.validatorId = user.id;
    if (user.restaurant?.id) rooms.restaurantId = user.restaurant.id;

    this.socket.emit('join', rooms);
  }

  on(event, callback) {
    if (!this.socket) return;

    this.socket.on(event, callback);

    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);
  }

  off(event, callback) {
    if (!this.socket) return;

    if (callback) {
      this.socket.off(event, callback);
    } else {
      this.socket.off(event);
    }
  }

  disconnect() {
    if (this.socket) {
      this.listeners.forEach((callbacks, event) => {
        callbacks.forEach((cb) => this.socket.off(event, cb));
      });
      this.listeners.clear();
      this.socket.disconnect();
      this.socket = null;
    }
  }
}

const socketService = new SocketService();
export default socketService;

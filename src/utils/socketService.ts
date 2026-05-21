import { Socket } from "socket.io-client";

class SocketService {
  private socket: Socket | null = null;

  setSocket(socket: Socket) {
    this.socket = socket;
  }

  emit(event: string, data?: unknown) {
    if (this.socket?.connected) {
      this.socket.emit(event, data);
    }
  }
}

export const socketService = new SocketService();

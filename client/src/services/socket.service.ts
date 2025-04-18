import io, { Socket } from "socket.io-client";
import { API_URL } from "./helpers.service";

class SocketService {
  private socket: typeof Socket | null = null;
  private connected = false;

  initialize(userId: string) {
    if (this.socket) return;

    try {
      this.socket = io(API_URL);

      this.socket.on("connect", () => {
        console.log("Socket connected");
        this.connected = true;
        this.socket?.emit("authenticate", { userId });
      });

      this.socket.on("disconnect", () => {
        console.log("Socket disconnected");
        this.connected = false;
      });

      this.socket.on("connect_error", (err: unknown) => {
        console.error("Socket connection error:", err);
        this.connected = false;
      });
    } catch (error) {
      console.error("Error initializing socket:", error);
    }
  }

  isConnected() {
    return this.connected;
  }

  onSongSelected(callback: (data: { songId: string }) => void) {
    if (!this.socket) return;
    this.socket.on("song_selected", callback);
  }

  selectSong(userId: string, songId: string) {
    if (!this.socket) return;
    this.socket.emit("select_song", { userId, songId });
  }

  quitSong(userId: string) {
    if (!this.socket) return;
    this.socket.emit("quit_song", { userId });
  }

  onSongQuit(callback: () => void) {
    if (!this.socket) return;
    this.socket.on("song_quit", callback);
  }

  disconnect() {
    if (!this.socket) return;
    this.socket.disconnect();
    this.socket = null;
    this.connected = false;
  }
}

const socketService = new SocketService();
export default socketService;

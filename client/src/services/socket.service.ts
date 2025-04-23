import io, { Socket } from "socket.io-client";
import { API_URL } from "./helpers.service";

type ConnectionChangeCallback = (status: boolean) => void;
type SongSelectedCallback = (data: { songId: string }) => void;
type ActiveSongCallback = (songId: string | null) => void;

class SocketService {
  private socket: typeof Socket | null = null;
  private connected = false;
  private userId: string | null = null;
  private pendingActions: (() => void)[] = [];
  private connectionListeners: ConnectionChangeCallback[] = [];
  private activeSongListeners: SongSelectedCallback[] = [];

  initialize(userId: string) {
    if (this.socket) return;

    this.userId = userId;

    try {
      this.socket = io(API_URL, {
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        timeout: 20000,
        auth: {
          userId, // Send userId for direct authentication as fallback
        },
      });

      this.setupListeners();
    } catch (error) {
      console.error("Error initializing socket:", error);
    }
  }

  private setupListeners() {
    if (!this.socket) return;

    this.socket.on("connect", () => {
      this.setConnected(true);

      this.processPendingActions();
    });

    this.socket.on("disconnect", () => {
      this.setConnected(false);
    });

    this.socket.on("connect_error", (err: unknown) => {
      console.error("Socket connection error:", err);
      this.setConnected(false);
    });

    this.socket.on("connection_status", (status: boolean) => {
      this.setConnected(status);
    });

    this.socket.on("reconnect", () => {
      this.setConnected(true);

      if (this.userId) {
        this.socket?.emit("authenticate", { userId: this.userId });
      }

      this.processPendingActions();
    });

    this.socket.on("reconnect_error", (error: Error) => {
      console.error("Reconnection error:", error);
      this.setConnected(false);
    });

    this.socket.on("reconnect_failed", () => {
      console.error("Failed to reconnect");
      this.setConnected(false);
    });

    this.socket.on(
      "auth_success",
      (data: {
        connected: boolean;
        message: string;
        activeSongId?: string;
      }) => {
        if (data.activeSongId) {
          this.notifyActiveSongListeners({ songId: data.activeSongId! });
        }
      }
    );
  }

  getActiveSong(callback: ActiveSongCallback) {
    if (!this.socket || !this.connected) {
      callback(null);
      return;
    }

    this.socket.emit("get_active_song", callback);
  }

  private notifyActiveSongListeners(data: { songId: string }) {
    this.activeSongListeners.forEach((callback) => callback(data));
  }

  private setConnected(status: boolean) {
    if (this.connected !== status) {
      this.connected = status;
      this.notifyConnectionListeners(status);
    }
  }

  private notifyConnectionListeners(status: boolean) {
    this.connectionListeners.forEach((callback) => callback(status));
  }

  private processPendingActions() {
    if (this.pendingActions.length > 0 && this.connected) {
      const actionsToProcess = [...this.pendingActions];
      this.pendingActions = [];

      actionsToProcess.forEach((action) => {
        try {
          action();
        } catch (error) {
          console.error("Error executing pending action:", error);
        }
      });
    }
  }

  isConnected() {
    return this.connected;
  }

  onConnectionChange(callback: ConnectionChangeCallback) {
    this.connectionListeners.push(callback);

    callback(this.connected);

    return () => {
      this.connectionListeners = this.connectionListeners.filter(
        (cb) => cb !== callback
      );
    };
  }

  offConnectionChange(callback: ConnectionChangeCallback) {
    this.connectionListeners = this.connectionListeners.filter(
      (cb) => cb !== callback
    );
  }

  onSongSelected(callback: SongSelectedCallback) {
    if (!this.socket) return;

    this.activeSongListeners.push(callback);

    this.socket.on("song_selected", callback);

    return () => {
      this.socket?.off("song_selected", callback);
      this.activeSongListeners = this.activeSongListeners.filter(
        (cb) => cb !== callback
      );
    };
  }

  onSongQuit(callback: () => void) {
    if (!this.socket) return;
    this.socket.on("song_quit", callback);

    return () => {
      this.socket?.off("song_quit", callback);
    };
  }

  selectSong(userId: string, songId: string): Promise<void> {
    if (!userId) return Promise.reject(new Error("No user ID provided"));

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error("Song selection timed out"));
      }, 8000);

      const confirmListener = (data: { songId: string }) => {
        if (data.songId === songId) {
          clearTimeout(timeout);
          this.socket?.off("song_selected", confirmListener);
          resolve();
        }
      };

      this.socket?.on("song_selected", confirmListener);

      if (this.connected && this.socket) {
        this.socket.emit("select_song", { userId, songId });
      } else {
        this.pendingActions.push(() => {
          this.socket?.emit("select_song", { userId, songId });
        });

        resolve();
      }

      const errorHandler = (error: Error) => {
        clearTimeout(timeout);
        this.socket?.off("connect_error", errorHandler);
        reject(error);
      };
      this.socket?.once("connect_error", errorHandler);
    });
  }

  quitSong(userId: string) {
    if (!userId) return;

    if (this.connected && this.socket) {
      this.socket.emit("quit_song", { userId });
    } else {
      this.pendingActions.push(() => {
        this.socket?.emit("quit_song", { userId });
      });
    }
  }

  disconnect() {
    if (!this.socket) return;

    this.socket.removeAllListeners();
    this.socket.disconnect();
    this.socket = null;
    this.connected = false;
    this.userId = null;
    this.pendingActions = [];
    this.activeSongListeners = [];

    this.notifyConnectionListeners(false);
  }
}

const socketService = new SocketService();
export default socketService;

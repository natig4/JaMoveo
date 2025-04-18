import io, { Socket } from "socket.io-client";
import { API_URL } from "./helpers.service";

type ConnectionChangeCallback = (status: boolean) => void;

class SocketService {
  private socket: typeof Socket | null = null;
  private connected = false;
  private userId: string | null = null;
  private pendingActions: (() => void)[] = [];
  private connectionListeners: ConnectionChangeCallback[] = [];

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
      console.log("Socket connected");
      this.setConnected(true);

      this.processPendingActions();
    });

    this.socket.on("disconnect", () => {
      console.log("Socket disconnected");
      this.setConnected(false);
    });

    this.socket.on("connect_error", (err: unknown) => {
      console.error("Socket connection error:", err);
      this.setConnected(false);
    });

    this.socket.on("connection_status", (status: boolean) => {
      this.setConnected(status);
    });

    this.socket.on("reconnect", (attemptNumber: number) => {
      console.log(`Reconnected after ${attemptNumber} attempts`);
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
      console.log(`Processing ${this.pendingActions.length} pending actions`);

      // Create a copy of pending actions and clear the original
      const actionsToProcess = [...this.pendingActions];
      this.pendingActions = [];

      // Execute each action
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

    // Immediately call with current status
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

  onSongSelected(callback: (data: { songId: string }) => void) {
    if (!this.socket) return;
    this.socket.on("song_selected", callback);

    return () => {
      this.socket?.off("song_selected", callback);
    };
  }

  onSongQuit(callback: () => void) {
    if (!this.socket) return;
    this.socket.on("song_quit", callback);

    return () => {
      this.socket?.off("song_quit", callback);
    };
  }

  selectSong(userId: string, songId: string) {
    if (!userId) return;

    if (this.connected && this.socket) {
      this.socket.emit("select_song", { userId, songId });
    } else {
      this.pendingActions.push(() => {
        this.socket?.emit("select_song", { userId, songId });
      });
      console.log(
        `Added select_song to pending actions queue. Song: ${songId}`
      );
    }
  }

  quitSong(userId: string) {
    if (!userId) return;

    if (this.connected && this.socket) {
      this.socket.emit("quit_song", { userId });
    } else {
      // Queue action for when connection returns
      this.pendingActions.push(() => {
        this.socket?.emit("quit_song", { userId });
      });
      console.log(`Added quit_song to pending actions queue.`);
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

    this.notifyConnectionListeners(false);
  }
}

const socketService = new SocketService();
export default socketService;

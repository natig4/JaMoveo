import io, { Socket } from "socket.io-client";
import { API_URL } from "./helpers.service";

type ConnectionChangeCallback = (status: boolean) => void;
type SongSelectedCallback = (data: { songId: string }) => void;
type ActiveSongCallback = (songId: string | null) => void;
type AuthSuccessCallback = (data: {
  connected: boolean;
  message: string;
  activeSongId?: string;
}) => void;

class SocketService {
  private socket: typeof Socket | null = null;
  private connected = false;
  private userId: string | null = null;
  private pendingActions: (() => void)[] = [];
  private connectionListeners: ConnectionChangeCallback[] = [];
  private activeSongListeners: SongSelectedCallback[] = [];
  private authSuccessListeners: AuthSuccessCallback[] = [];
  private initPromise: Promise<boolean> | null = null;
  private reconnecting = false;

  initialize(userId: string): Promise<boolean> {
    if (this.initPromise && !this.reconnecting) return this.initPromise;

    this.userId = userId;
    this.reconnecting = false;

    this.initPromise = new Promise((resolve) => {
      try {
        if (this.socket && this.socket.connected) {
          this.socket.disconnect();
          this.socket = null;
        }

        console.log(`Initializing socket for user ${userId}`);
        this.socket = io(API_URL, {
          reconnectionAttempts: 10,
          reconnectionDelay: 1000,
          reconnectionDelayMax: 5000,
          timeout: 20000,
          auth: {
            userId, // Send userId for direct authentication as fallback
          },
          autoConnect: true,
          transports: ["websocket", "polling"],
        });

        this.setupListeners();

        // Add a timeout to ensure we don't wait forever for connection
        const connectionTimeout = setTimeout(() => {
          if (!this.connected) {
            console.log("Socket connection timed out");
            resolve(false);
          }
        }, 8000);

        // Add an early connection handler to clear the timeout
        this.socket.once("connect", () => {
          clearTimeout(connectionTimeout);
          resolve(true);
        });
      } catch (error) {
        console.error("Error initializing socket:", error);
        resolve(false);
      }
    });

    return this.initPromise;
  }

  private setupListeners() {
    if (!this.socket) return;

    this.socket.removeAllListeners();

    this.socket.on("connect", () => {
      console.log("Socket connected");
      this.setConnected(true);

      if (this.userId) {
        console.log(`Authenticating socket for user ${this.userId}`);
        this.socket?.emit("authenticate", { userId: this.userId });
      }

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
      console.log("Connection status update:", status);
      this.setConnected(status);
    });

    this.socket.on("reconnect", (attemptNumber: number) => {
      console.log(`Socket reconnected after ${attemptNumber} attempts`);
      this.setConnected(true);

      if (this.userId) {
        console.log(`Re-authenticating socket for user ${this.userId}`);
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
        console.log("Auth success:", data);
        this.setConnected(data.connected);

        this.notifyAuthSuccessListeners(data);

        if (data.activeSongId) {
          this.notifyActiveSongListeners({ songId: data.activeSongId });
        }
      }
    );

    this.socket.on("song_selected", (data: { songId: string }) => {
      console.log("Song selected event:", data);
      this.notifyActiveSongListeners(data);
    });

    this.socket.on("song_quit", () => {
      console.log("Song quit event received");
    });
  }

  getActiveSong(callback: ActiveSongCallback) {
    if (!this.socket || !this.connected) {
      console.log("Socket not available for getActiveSong request");
      callback(null);
      return;
    }

    const timeoutId = setTimeout(() => {
      console.log("getActiveSong timed out");
      callback(null);
    }, 5000);

    const action = () => {
      console.log("Requesting active song");
      this.socket?.emit("get_active_song", (result: string | null) => {
        clearTimeout(timeoutId);
        callback(result);
      });
    };

    if (this.connected) {
      action();
    } else {
      this.pendingActions.push(action);
      // Also return null immediately to avoid hanging
      callback(null);
    }
  }

  private notifyActiveSongListeners(data: { songId: string }) {
    this.activeSongListeners.forEach((callback) => callback(data));
  }

  private notifyAuthSuccessListeners(data: {
    connected: boolean;
    message: string;
    activeSongId?: string;
  }) {
    this.authSuccessListeners.forEach((callback) => callback(data));
  }

  private setConnected(status: boolean) {
    if (this.connected !== status) {
      console.log(`Socket connection status changed: ${status}`);
      this.connected = status;
      this.notifyConnectionListeners(status);

      if (status) {
        this.processPendingActions();
      }
    }
  }

  private notifyConnectionListeners(status: boolean) {
    this.connectionListeners.forEach((callback) => callback(status));
  }

  private processPendingActions() {
    if (this.pendingActions.length > 0 && this.connected) {
      console.log(`Processing ${this.pendingActions.length} pending actions`);
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

  onAuthSuccess(callback: AuthSuccessCallback) {
    this.authSuccessListeners.push(callback);

    return () => {
      this.authSuccessListeners = this.authSuccessListeners.filter(
        (cb) => cb !== callback
      );
    };
  }

  onSongSelected(callback: SongSelectedCallback) {
    if (!this.socket) return;

    this.activeSongListeners.push(callback);

    return () => {
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
    if (!songId) return Promise.reject(new Error("No song ID provided"));

    console.log(`Selecting song: ${songId} by user: ${userId}`);
    const requestId = `${userId}-${songId}-${Date.now()}`;

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error("Song selection timed out service"));
      }, 8000);

      const action = () => {
        this.socket?.emit("select_song", { userId, songId, requestId });
        resolve();
      };

      if (this.connected && this.socket) {
        action();
      } else {
        console.log("Queuing song selection for later");
        this.pendingActions.push(action);
        resolve(); // Optimistically resolve since we've queued the action
      }

      clearTimeout(timeout);
    });
  }

  quitSong(userId: string) {
    if (!userId) return;
    console.log(`Quitting song for user: ${userId}`);

    const action = () => {
      this.socket?.emit("quit_song", { userId });
    };

    if (this.connected && this.socket) {
      action();
    } else {
      this.pendingActions.push(action);
    }
  }

  reconnect() {
    if (this.userId) {
      console.log("Forced socket reconnection");

      this.reconnecting = true;

      return new Promise<void>((resolve) => {
        if (this.socket) {
          this.socket.once("disconnect", () => {
            console.log("Socket disconnected, ready for reconnection");
            this.socket = null;
            this.connected = false;
            this.initPromise = null;
            this.notifyConnectionListeners(false);

            this.initialize(this.userId!).then(() => {
              resolve();
            });
          });

          this.socket.disconnect();
        } else {
          this.connected = false;
          this.initPromise = null;
          this.notifyConnectionListeners(false);

          this.initialize(this.userId!).then(() => {
            resolve();
          });
        }
      });
    }

    return Promise.resolve();
  }

  disconnect() {
    console.log("Disconnecting socket");
    if (!this.socket) return;

    this.socket.disconnect();
    this.socket = null;
    this.connected = false;
    this.userId = null;
    this.pendingActions = [];
    this.initPromise = null;
    this.reconnecting = false;

    this.notifyConnectionListeners(false);
  }
}

const socketService = new SocketService();
export default socketService;

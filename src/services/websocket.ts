import { DetectionResult, AlertEvent } from '../types';

export interface WebSocketMessage {
  type: 'detection' | 'pong' | 'error';
  session_id?: string;
  frame_index?: number;
  result?: DetectionResult;
  alert?: AlertEvent | null;
}

export class MonitoringWebSocket {
  private ws: WebSocket | null = null;
  private sessionId: string;
  private url: string;
  private isIntentionalClose: boolean = false;
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 5;
  private reconnectTimeout: number | null = null;

  public onDetection: ((result: DetectionResult, alert: AlertEvent | null) => void) | null = null;
  public onStatusChange: ((status: 'connecting' | 'connected' | 'disconnected' | 'error') => void) | null = null;

  constructor(sessionId: string) {
    this.sessionId = sessionId;
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.hostname || 'localhost';
    this.url = `${protocol}//${host}:8000/ws/monitoring/${sessionId}`;
  }

  public connect() {
    this.isIntentionalClose = false;
    this.onStatusChange?.('connecting');

    try {
      this.ws = new WebSocket(this.url);

      this.ws.onopen = () => {
        this.reconnectAttempts = 0;
        this.onStatusChange?.('connected');
        console.info(`[RoadGuard WS] Connected to session ${this.sessionId}`);
      };

      this.ws.onmessage = (event) => {
        try {
          const msg: WebSocketMessage = JSON.parse(event.data);
          if (msg.type === 'detection' && msg.result) {
            this.onDetection?.(msg.result, msg.alert || null);
          }
        } catch (err) {
          console.error('[RoadGuard WS] Parse error:', err);
        }
      };

      this.ws.onerror = (err) => {
        console.warn('[RoadGuard WS] Error:', err);
        this.onStatusChange?.('error');
      };

      this.ws.onclose = () => {
        this.onStatusChange?.('disconnected');
        if (!this.isIntentionalClose && this.reconnectAttempts < this.maxReconnectAttempts) {
          this.reconnectAttempts++;
          const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 8000);
          console.info(`[RoadGuard WS] Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts})...`);
          this.reconnectTimeout = window.setTimeout(() => this.connect(), delay);
        }
      };
    } catch (e) {
      this.onStatusChange?.('error');
    }
  }

  public sendFrame(base64Data: string, fps: number = 15.0) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({
        type: 'frame',
        data: base64Data,
        fps: fps,
        timestamp: new Date().toISOString()
      }));
    }
  }

  public disconnect() {
    this.isIntentionalClose = true;
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
    }
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
}


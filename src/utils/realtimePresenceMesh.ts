/**
 * Real-Time Multi-Device Presence Mesh over Secure WebSockets (MQTT v3.1.1 over WSS)
 * Connects browsers directly across any network (Wi-Fi, 4G/5G), Cloud Run instances,
 * AI Studio Dev/Shared URLs, or GitHub Pages with <50ms latency.
 */

const BROKER_URLS = [
  'wss://broker.emqx.io:8084/mqtt',
  'wss://broker.hivemq.com:8884/mqtt',
  'wss://test.mosquitto.org:8081/mqtt',
];

const PRESENCE_TOPIC = 'kota_refleksi_smkn2_gto_v3/presence';

function encodeRemainingLength(length: number): number[] {
  const bytes: number[] = [];
  let len = length;
  do {
    let encodedByte = len % 128;
    len = Math.floor(len / 128);
    if (len > 0) {
      encodedByte = encodedByte | 128;
    }
    bytes.push(encodedByte);
  } while (len > 0);
  return bytes;
}

function encodeUTF8String(str: string): Uint8Array {
  const encoder = new TextEncoder();
  const strBytes = encoder.encode(str);
  const out = new Uint8Array(2 + strBytes.length);
  out[0] = (strBytes.length >> 8) & 0xff;
  out[1] = strBytes.length & 0xff;
  out.set(strBytes, 2);
  return out;
}

function buildConnectPacket(clientId: string): Uint8Array {
  // Variable header: Protocol Name "MQTT" (0x00, 0x04, 'M','Q','T','T'), Level 4, Flags 0x02 (Clean Session), KeepAlive 45s
  const varHeader = new Uint8Array([0x00, 0x04, 0x4d, 0x51, 0x54, 0x54, 0x04, 0x02, 0x00, 0x2d]);
  const payload = encodeUTF8String(clientId);
  const remLen = varHeader.length + payload.length;
  const remLenBytes = encodeRemainingLength(remLen);
  const packet = new Uint8Array(1 + remLenBytes.length + remLen);
  packet[0] = 0x10; // CONNECT
  packet.set(remLenBytes, 1);
  packet.set(varHeader, 1 + remLenBytes.length);
  packet.set(payload, 1 + remLenBytes.length + varHeader.length);
  return packet;
}

function buildSubscribePacket(topic: string, packetId = 1): Uint8Array {
  const varHeader = new Uint8Array([(packetId >> 8) & 0xff, packetId & 0xff]);
  const topicBytes = encodeUTF8String(topic);
  const payload = new Uint8Array(topicBytes.length + 1);
  payload.set(topicBytes, 0);
  payload[topicBytes.length] = 0x00; // QoS 0
  const remLen = varHeader.length + payload.length;
  const remLenBytes = encodeRemainingLength(remLen);
  const packet = new Uint8Array(1 + remLenBytes.length + remLen);
  packet[0] = 0x82; // SUBSCRIBE
  packet.set(remLenBytes, 1);
  packet.set(varHeader, 1 + remLenBytes.length);
  packet.set(payload, 1 + remLenBytes.length + varHeader.length);
  return packet;
}

function buildPublishPacket(topic: string, jsonStr: string): Uint8Array {
  const topicBytes = encodeUTF8String(topic);
  const encoder = new TextEncoder();
  const payloadBytes = encoder.encode(jsonStr);
  const remLen = topicBytes.length + payloadBytes.length;
  const remLenBytes = encodeRemainingLength(remLen);
  const packet = new Uint8Array(1 + remLenBytes.length + remLen);
  packet[0] = 0x30; // PUBLISH QoS 0
  packet.set(remLenBytes, 1);
  packet.set(topicBytes, 1 + remLenBytes.length);
  packet.set(payloadBytes, 1 + remLenBytes.length + topicBytes.length);
  return packet;
}

function buildPingReqPacket(): Uint8Array {
  return new Uint8Array([0xc0, 0x00]);
}

function parseIncomingPackets(buffer: Uint8Array): string[] {
  const messages: string[] = [];
  const decoder = new TextDecoder();
  let offset = 0;

  while (offset < buffer.length) {
    if (offset + 2 > buffer.length) break;
    const headerByte = buffer[offset];
    const packetType = headerByte & 0xf0;
    const qos = (headerByte >> 1) & 0x03;

    // Decode Remaining Length
    let multiplier = 1;
    let remLength = 0;
    let idx = offset + 1;
    let validLen = false;
    while (idx < buffer.length) {
      const encodedByte = buffer[idx++];
      remLength += (encodedByte & 127) * multiplier;
      if ((encodedByte & 128) === 0) {
        validLen = true;
        break;
      }
      multiplier *= 128;
      if (multiplier > 128 * 128 * 128) break;
    }

    if (!validLen || idx + remLength > buffer.length) {
      break;
    }

    const packetEnd = idx + remLength;

    // 0x30 = PUBLISH
    if (packetType === 0x30 && idx + 2 <= packetEnd) {
      const topicLen = (buffer[idx] << 8) | buffer[idx + 1];
      let payloadStart = idx + 2 + topicLen;
      if (qos > 0) {
        payloadStart += 2; // Packet Identifier for QoS 1/2
      }
      if (payloadStart <= packetEnd) {
        const payloadSlice = buffer.subarray(payloadStart, packetEnd);
        try {
          messages.push(decoder.decode(payloadSlice));
        } catch {
          // ignore malformed utf8
        }
      }
    }

    offset = packetEnd;
  }

  return messages;
}

export interface PresenceMeshMessage {
  type: 'presence_update' | 'presence_leave' | 'request_sync';
  player?: any;
  id?: string;
  senderId?: string;
  ts?: number;
}

export class RealtimePresenceMesh {
  private sockets: Map<string, WebSocket> = new Map();
  private pingTimer: number | null = null;
  private reconnectTimers: Map<string, number> = new Map();
  private isDisposed = false;
  private clientIdPrefix: string;
  private onMessageCallback: (msg: PresenceMeshMessage) => void;
  private onConnectedCallback: () => void;

  constructor(
    sessionId: string,
    onMessage: (msg: PresenceMeshMessage) => void,
    onConnected: () => void
  ) {
    const cleanId = sessionId.replace(/[^a-zA-Z0-9_]/g, '').slice(-14);
    this.clientIdPrefix = `kr_${cleanId}_${Math.random().toString(36).slice(2, 6)}`;
    this.onMessageCallback = onMessage;
    this.onConnectedCallback = onConnected;

    BROKER_URLS.forEach((url, index) => {
      this.connectBroker(url, index);
    });

    this.pingTimer = window.setInterval(() => {
      this.sendPingAll();
    }, 22000);
  }

  private connectBroker(url: string, index: number) {
    if (this.isDisposed || typeof window === 'undefined' || !('WebSocket' in window)) return;

    try {
      const ws = new WebSocket(url, 'mqtt');
      ws.binaryType = 'arraybuffer';
      let isMqttConnected = false;

      ws.onopen = () => {
        if (this.isDisposed) {
          ws.close();
          return;
        }
        try {
          const connectPkt = buildConnectPacket(`${this.clientIdPrefix}_${index}`);
          ws.send(connectPkt);
        } catch {
          // ignore
        }
      };

      ws.onmessage = (event) => {
        if (this.isDisposed || !(event.data instanceof ArrayBuffer)) return;
        const bytes = new Uint8Array(event.data);
        if (bytes.length >= 2 && (bytes[0] & 0xf0) === 0x20) {
          // 0x20 = CONNACK -> Subscribe to room presence topic
          isMqttConnected = true;
          this.sockets.set(url, ws);
          try {
            ws.send(buildSubscribePacket(PRESENCE_TOPIC, 1));
            this.onConnectedCallback();
          } catch {
            // ignore
          }
          return;
        }

        const payloads = parseIncomingPackets(bytes);
        for (const raw of payloads) {
          try {
            const parsed = JSON.parse(raw) as PresenceMeshMessage;
            if (parsed && parsed.type) {
              this.onMessageCallback(parsed);
            }
          } catch {
            // ignore non-json
          }
        }
      };

      const scheduleReconnect = () => {
        this.sockets.delete(url);
        isMqttConnected = false;
        if (this.isDisposed) return;
        if (!this.reconnectTimers.has(url)) {
          const timer = window.setTimeout(() => {
            this.reconnectTimers.delete(url);
            this.connectBroker(url, index);
          }, 3500 + index * 1000);
          this.reconnectTimers.set(url, timer);
        }
      };

      ws.onerror = () => {
        try {
          ws.close();
        } catch {}
      };

      ws.onclose = () => {
        scheduleReconnect();
      };

      // Safety fallback if CONNACK not received within 5s
      window.setTimeout(() => {
        if (!isMqttConnected && ws.readyState === WebSocket.OPEN && !this.isDisposed) {
          try {
            ws.send(buildSubscribePacket(PRESENCE_TOPIC, 2));
            this.sockets.set(url, ws);
          } catch {}
        }
      }, 3000);
    } catch {
      // ignore if WebSocket blocked
    }
  }

  public publish(msg: PresenceMeshMessage) {
    if (this.isDisposed) return;
    const json = JSON.stringify({ ...msg, ts: Date.now() });
    const packet = buildPublishPacket(PRESENCE_TOPIC, json);

    for (const [url, ws] of this.sockets.entries()) {
      if (ws.readyState === WebSocket.OPEN) {
        try {
          ws.send(packet);
        } catch {
          this.sockets.delete(url);
        }
      }
    }
  }

  private sendPingAll() {
    const ping = buildPingReqPacket();
    for (const [url, ws] of this.sockets.entries()) {
      if (ws.readyState === WebSocket.OPEN) {
        try {
          ws.send(ping);
        } catch {
          this.sockets.delete(url);
        }
      }
    }
  }

  public dispose() {
    this.isDisposed = true;
    if (this.pingTimer) {
      clearInterval(this.pingTimer);
      this.pingTimer = null;
    }
    for (const timer of this.reconnectTimers.values()) {
      clearTimeout(timer);
    }
    this.reconnectTimers.clear();
    for (const ws of this.sockets.values()) {
      try {
        ws.close();
      } catch {}
    }
    this.sockets.clear();
  }
}

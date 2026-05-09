import { ENDPOINT_WS } from "../Config";
import { useMetricsStore } from "../stores/MetricsStore";

type InstanceMetrics = {
    exists: boolean;
    total_memory: number;
    memory_used_bytes: number;
    cpu_usage: number;
    instance_id: number;
};

/*
"swap_used": swap_used,
"swap_total": swap_total,
"cpu": cpu_usage_sys,
"mem_used": mem_sys,
"mem_total": mem_total_sys
*/

type SystemMetrics = {
    swap_used: number;
    swap_total: number;
    cpu: number;
    mem_used: number;
    mem_total: number;
};

type LogsResponse = {
    lines: {
        line: string;
        number: number;
    }[];
};

type WebSocketMessage = {
    type: string;
    instance_id: number | null;
    data: InstanceMetrics | SystemMetrics | LogsResponse;
};

class MetricsServiceClass {
    private ws: WebSocket | null = null;
    private trackingInstanceID: number = -1;

    private subscribedStreams: Set<string> = new Set();
    private queuedMessages: string[] = [];

    private connecting: boolean = false;
    private connected: boolean = false;

    constructor() {}

    connect() {
        if (this.connecting) {
            console.warn("Ignored second connect call, already connecting");
            return;
        }
        if (this.connected) {
            console.warn("Ignored connect call, websocket already connected");
            return;
        }
        this.connecting = true;

        console.log("Connecting to WebSocket stream 'metrics'");

        const WS_URL =
            ENDPOINT_WS ||
            `${window.location.protocol === "https:" ? "wss" : "ws"}://${window.location.host}`;

        this.ws = new WebSocket(`${WS_URL}/api/v1/stream/metrics`);

        this.ws.onopen = () => {
            if (!this.ws) {
                throw new Error("No WebSocket found");
            }
            console.log(
                `Sending ${this.queuedMessages.length} queued messages`,
            );
            for (const message of this.queuedMessages) {
                this.ws.send(message);
            }
            this.queuedMessages.length = 0;
            console.log("WebSocket stream connected");
            this.connecting = false;
            this.connected = true;
        };

        this._setupEventHandlers();
    }

    private _send(data: string) {
        if (!this.connected) {
            this.queuedMessages.push(data);
        }
        if (this.connected && this.ws) {
            this.ws.send(data);
        }
    }

    private _handleInstanceMetrics(data: InstanceMetrics) {
        const messageData = data as InstanceMetrics;
        if (messageData.instance_id != this.trackingInstanceID) {
            console.warn(
                "Received metrics for instance ID that is not being tracked",
            );
            return;
        }

        const currentState = useMetricsStore.getState();

        currentState.setInstanceOnline(messageData.exists);
        currentState.setInstanceCpu(messageData.cpu_usage);
        currentState.setInstanceMem(messageData.memory_used_bytes);
        currentState.setInstanceMemTotal(messageData.total_memory);
    }

    private _handleSystemMetrics(data: SystemMetrics) {
        if (this.trackingInstanceID != -1) {
            console.warn(
                "Should not be receiving system metrics when an instance is tracked",
            );
            return;
        }

        const currentState = useMetricsStore.getState();

        currentState.setSystemCpu(data.cpu);
        currentState.setSystemMem(data.mem_used);
        currentState.setSystemMemTotal(data.mem_total);
        currentState.setSystemSwap(data.swap_used);
        currentState.setSystemSwapTotal(data.swap_total);
    }

    private _setupEventHandlers() {
        if (!this.ws) {
            throw new Error("No WebSocket exists");
        }

        this.ws.onmessage = (event: MessageEvent) => {
            try {
                const message: WebSocketMessage = JSON.parse(event.data);
                if (message.type == "metrics") {
                    if (message.instance_id == null) {
                        throw new Error(
                            "Invalid message: message of type instance metrics, but no instance ID",
                        );
                    }
                    this._handleInstanceMetrics(
                        message.data as InstanceMetrics,
                    );
                } else if (message.type == "system_metrics") {
                    this._handleSystemMetrics(message.data as SystemMetrics);
                } else if (message.type == "logs") {
                    const d = message.data as LogsResponse;
                    const linesReadSet = useMetricsStore.getState().linesRead;
                    for (const line of d.lines) {
                        if (linesReadSet.has(line.number)) {
                            console.warn(
                                `Duplicate line read: ${line.number}. Ignoring: `, line
                            );
                            return;
                        }
                        useMetricsStore.getState().addLog({"content": line.line, "line": line.number});
                        linesReadSet.add(line.number);
                    }
                } else {
                    throw new Error(`Unknown message type: ${message.type}`);
                }
            } catch (e) {
                console.error("Failed to process message: ", e);
            }
        };
    }

    subscribe(type: string, instanceId: number) {
        const data = {
            type: "subscribe",
            stream: type,
            instance_id: instanceId,
        };

        this.trackingInstanceID = instanceId;
        this.subscribedStreams.add(type);

        this._send(JSON.stringify(data));
        console.log("Subscribed to stream: ", type);
    }

    unsubscribe(type: string, instanceId: number) {
        if (!this.subscribedStreams.has(type)) {
            throw new Error(`Stream ${type} not subscribed`);
        }

        const data = {
            type: "unsubscribe",
            stream: type,
            instance_id: instanceId,
        };

        this._send(JSON.stringify(data));
        this.subscribedStreams.delete(type);
        console.log("Unsubscribed: ", type);
    }

    setInstanceId(instanceId: number) {
        this.trackingInstanceID = instanceId;
    }
}

export const MetricsService = new MetricsServiceClass();

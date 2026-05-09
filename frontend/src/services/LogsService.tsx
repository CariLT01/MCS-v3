import { ENDPOINT } from "../Config";
import { useMetricsStore } from "../stores/MetricsStore";

type Log = {
    line: number;
    content: string;
}

class LogsServiceClass {

    private loaded: boolean = false;

    constructor() {

    }

    async load(instanceId: number) {
        if (this.loaded) {
            console.warn("duplicate load call");
            return;
        }

        const res = await fetch(`${ENDPOINT}/api/v1/logs/load?instance_id=${instanceId}`);
        if (!res.ok) {
            throw new Error("Failed to load logs");
        }

        const data: Log[] = await res.json();
        for (const line of data) {
            const linesRead = useMetricsStore.getState().linesRead;
            if (linesRead.has(line.line)) {
                console.warn(`Duplicate line: ${line.line} already read`);
                continue;
            }
            useMetricsStore.getState().addLog(line);
            linesRead.add(line.line);
        }
        this.loaded = true;
    }

    resetLogsState() {
        this.loaded = false;
        useMetricsStore.setState({logs: []});
        useMetricsStore.getState().linesRead.clear();
    }
}

export const LogsService = new LogsServiceClass();
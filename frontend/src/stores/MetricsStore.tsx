import { create } from "zustand";

const HISTORY_LIMIT = 60;
const LOG_LIMIT = 1000;

export type Point = {
    key: number;   // unix timestamp (ms)
    value: number;
};

export type Log = {
    line: number;
    content: string;
}

const appendWithLimit = (
    arr: Point[],
    value: number,
    limit = HISTORY_LIMIT
): Point[] => {
    const next: Point[] = [
        ...arr,
        {
            key: Date.now(),
            value,
        },
    ];

    if (next.length > limit) {
        next.shift();
    }

    return next;
};

const appendWithLimitLogs = (
    arr: Log[],
    value: Log,
    limit = HISTORY_LIMIT
): Log[] => {
    const next: Log[] = [
        ...arr,
        value,
    ];

    if (next.length > limit) {
        next.shift();
    }

    return next;
};

interface MetricsStore {
    systemCpu: number;
    systemCpuPast: Point[];

    systemMem: number;
    systemMemPast: Point[];
    systemMemTotal: number;

    systemSwap: number;
    systemSwapPast: Point[];
    systemSwapTotal: number;

    instanceId: number;

    instanceCpu: number;
    instanceCpuPast: Point[];

    instanceMem: number;
    instanceMemPast: Point[];
    instanceMemTotal: number;

    instanceOnline: boolean;

    logs: Log[];
    linesRead: Set<number>;

    setSystemCpu: (value: number) => void;
    setSystemMem: (value: number) => void;
    setSystemMemTotal: (value: number) => void;

    setSystemSwap: (value: number) => void;
    setSystemSwapTotal: (value: number) => void;

    setInstanceId: (value: number) => void;

    setInstanceCpu: (value: number) => void;

    setInstanceMem: (value: number) => void;
    setInstanceMemTotal: (value: number) => void;

    resetHistory: () => void;

    setInstanceOnline: (value: boolean) => void;

    addLog: (line: Log) => void;
}

export const useMetricsStore = create<MetricsStore>((set) => ({
    systemCpu: 0,
    systemCpuPast: new Array(HISTORY_LIMIT)
        .fill(0)
        .map(() => ({ key: Date.now(), value: 0 })),

    systemMem: 0,
    systemMemPast: new Array(HISTORY_LIMIT)
        .fill(0)
        .map(() => ({ key: Date.now(), value: 0 })),
    systemMemTotal: 0,

    systemSwap: 0,
    systemSwapPast: new Array(HISTORY_LIMIT)
        .fill(0)
        .map(() => ({ key: Date.now(), value: 0 })),
    systemSwapTotal: 0,

    instanceId: 0,

    instanceCpu: 0,
    instanceCpuPast: new Array(HISTORY_LIMIT)
        .fill(0)
        .map(() => ({ key: Date.now(), value: 0 })),

    instanceMem: 0,
    instanceMemPast: new Array(HISTORY_LIMIT)
        .fill(0)
        .map(() => ({ key: Date.now(), value: 0 })),
    instanceMemTotal: 0,

    instanceOnline: false,
    logs: [],

    setSystemCpu: (value) =>
        set((state) => ({
            systemCpu: value,
            systemCpuPast: appendWithLimit(state.systemCpuPast, value),
        })),

    setSystemMem: (value) =>
        set((state) => ({
            systemMem: value,
            systemMemPast: appendWithLimit(state.systemMemPast, value),
        })),

    setSystemMemTotal: (value) =>
        set({
            systemMemTotal: value,
        }),

    setSystemSwap: (value) =>
        set((state) => ({
            systemSwap: value,
            systemSwapPast: appendWithLimit(state.systemSwapPast, value),
        })),

    setSystemSwapTotal: (value) =>
        set({
            systemSwapTotal: value,
        }),

    setInstanceId: (value) =>
        set({
            instanceId: value,
        }),

    setInstanceCpu: (value) =>
        set((state) => ({
            instanceCpu: value,
            instanceCpuPast: appendWithLimit(state.instanceCpuPast, value),
        })),

    setInstanceMem: (value) =>
        set((state) => ({
            instanceMem: value,
            instanceMemPast: appendWithLimit(state.instanceMemPast, value),
        })),

    setInstanceMemTotal: (value) =>
        set({
            instanceMemTotal: value,
        }),

    resetHistory: () =>
        set({
            systemCpuPast: [],
            systemMemPast: [],
            systemSwapPast: [],
            instanceCpuPast: [],
            instanceMemPast: [],
        }),

    setInstanceOnline: (value: boolean) =>
        set({
            instanceOnline: value,
        }),
    
    addLog: (line) => {
        set((state) => ({
            logs: appendWithLimitLogs(state.logs, line, LOG_LIMIT)
        }))
    },

    linesRead: new Set()
}));
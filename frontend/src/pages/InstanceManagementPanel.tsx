// temporary line chart data

import { useNavigate, useParams } from "react-router-dom";
import { SectionTitleSmall } from "../components/SectionTitleSmall";
import { StatisticsCard, type StatisticsData } from "./StatisticsCard";
import { ToolFeatureCard } from "./ToolFeatureCard";
import { useEffect, useMemo, useRef, useState } from "react";
import { InstancesService } from "../services/InstancesService";
import { useInstanceManagementStore } from "../stores/InstancesManagmentStore";
import { MetricsService } from "../services/MetricsService";
import { useMetricsStore } from "../stores/MetricsStore";
import { HappyPing, SadPing } from "./Pings";
import { LogsService } from "../services/LogsService";
import { Button } from "../components/Button";
import {
    IconPlayerStop,
    IconPlayerStopFilled,
    IconPower,
    IconRotateClockwise2,
    IconSkull,
} from "@tabler/icons-react";
import { ENDPOINT } from "../Config";

function formatBytes(bytes: number) {
    if (bytes === 0) return "0.0 B";

    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB", "TB"];

    const i = Math.floor(Math.log(bytes) / Math.log(k));
    const value = bytes / Math.pow(k, i);

    return `${value.toFixed(1)} ${sizes[i]}`;
}

export function InstanceManagementPanel() {
    const setLastId = useInstanceManagementStore((state) => state.setLastId);

    const { instance_id } = useParams();

    const [instanceName, setInstanceName] = useState<string>("");

    useEffect(() => {
        if (useInstanceManagementStore.getState().lastId == instance_id) {
            return;
        }

        console.log("Instance ID changed: ", instance_id);
        setLastId(instance_id ?? "");

        if (!instance_id) {
            return;
        }

        const f = async () => {
            const name = await InstancesService.getInstanceName(
                parseInt(instance_id, 10),
            );
            setInstanceName(name ?? "");
        };
        f();
    }, [instance_id, setInstanceName, setLastId]);

    useEffect(() => {
        if (!instance_id) return;
        LogsService.resetLogsState();
        MetricsService.subscribe("metrics", parseInt(instance_id, 10));
        MetricsService.subscribe("logs", parseInt(instance_id, 10));
        (async () => {
            await LogsService.load(parseInt(instance_id, 10));
        })();
        return () => {
            MetricsService.unsubscribe("metrics", parseInt(instance_id, 10));
            MetricsService.unsubscribe("logs", parseInt(instance_id, 10));
        };
    }, [instance_id]);

    const exists = useMetricsStore((state) => state.instanceOnline);

    const instCpu = useMetricsStore((state) => state.instanceCpu);
    const instCpuPast = useMetricsStore((state) => state.instanceCpuPast);
    const instCpuChart: StatisticsData[] = useMemo(() => {
        const data: StatisticsData[] = [];
        for (const value of instCpuPast) {
            data.push({ id: value.key, value: value.value });
        }
        return data;
    }, [instCpuPast]);
    const instanceMem = useMetricsStore((state) => state.instanceMem);
    const instanceMemPast = useMetricsStore((staet) => staet.instanceMemPast);
    const instanceMemChart: StatisticsData[] = useMemo(() => {
        const data: StatisticsData[] = [];
        for (const value of instanceMemPast) {
            data.push({ id: value.key, value: value.value });
        }
        return data;
    }, [instanceMemPast]);
    const instanceMemTotal = useMetricsStore((state) => state.instanceMemTotal);

    const logs = useMetricsStore((state) => state.logs);

    const logContainerRef = useRef<HTMLDivElement | null>(null);
    const shouldAutoScrollRef = useRef(true);
    const isFirstLoadRef = useRef(true);

    const handleScroll = () => {
        const el = logContainerRef.current;
        if (!el) return;

        const threshold = 50; // px tolerance
        const isAtBottom =
            el.scrollHeight - el.scrollTop - el.clientHeight < threshold;

        shouldAutoScrollRef.current = isAtBottom;
    };

    useEffect(() => {
        const el = logContainerRef.current;
        if (!el) return;

        // first load: always scroll down
        if (isFirstLoadRef.current) {
            el.scrollTop = el.scrollHeight;
            isFirstLoadRef.current = false;
            shouldAutoScrollRef.current = true;
            return;
        }

        // later updates: only scroll if user is at bottom
        if (shouldAutoScrollRef.current) {
            el.scrollTop = el.scrollHeight;
        }
    }, [logs]);

    const navigate = useNavigate();

    return (
        <div className="flex flex-col gap-6 px-4 py-4">
            <header className="w-full h-fit py-2 px-2 rounded-md flex gap-3 items-center shadow-md border border-black/15 dark:border-white/15">
                <button
                    className="cursor-pointer rounded-full"
                    onClick={() => navigate("/")}
                >
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        height="24px"
                        viewBox="0 -960 960 960"
                        width="24px"
                        fill="currentColor"
                    >
                        <path d="m313-440 224 224-57 56-320-320 320-320 57 56-224 224h487v80H313Z" />
                    </svg>
                </button>
                <div className="flex-grow-1 flex justify-center text-xl font-semibold tracking-tight">
                    Managing {instanceName}
                </div>
            </header>

            <SectionTitleSmall
                title="Resource Usage"
                description="Process CPU and RAM usage"
            ></SectionTitleSmall>

            <div className="px-2 py-2 rounded-md border border-black/15 dark:border-white/15">
                <div className="flex gap-3 items-center">
                    {exists ? <HappyPing></HappyPing> : <SadPing></SadPing>}
                    <h2 className="text-lg font-semibold tracking-tight">
                        {exists ? "Instance online" : "Instance offline"}
                    </h2>
                </div>
                <p className="text-xs text-gray-700 leading-relaxed">
                    {exists
                        ? "Your instance seems to be active or starting."
                        : "Your instance is offline"}
                </p>
            </div>

            <div className="flex gap-3">
                <StatisticsCard
                    data={instCpuChart}
                    max={100}
                    name="CPU"
                    description="Processor usage across all cores accumulated (%)"
                    currentValue={`${Math.round(instCpu)}%`}
                    color="#6366f1"
                    maxHuman="100%"
                ></StatisticsCard>
                <StatisticsCard
                    data={instanceMemChart}
                    max={instanceMemTotal}
                    name="RAM"
                    description="Memory usage used by this instance process (gigabytes)"
                    currentValue={`${formatBytes(instanceMem)}`}
                    maxHuman={`${formatBytes(instanceMemTotal)}`}
                    color="#00df77"
                ></StatisticsCard>
            </div>

            <div className="flex gap-3">
                {exists && (
                    <>
                        <Button
                            icon={<IconRotateClockwise2></IconRotateClockwise2>}
                            filledIcon={
                                <IconRotateClockwise2></IconRotateClockwise2>
                            }
                            text="Restart Instance"
                            onClick={async () => {
                                try {
                                    const r = await fetch(
                                        `${ENDPOINT}/api/v1/instance/restart`,
                                        {
                                            method: "POST",
                                            body: JSON.stringify({
                                                instance_id: parseInt(
                                                    instance_id ?? "",
                                                    10,
                                                ),
                                            }),
                                            headers: {
                                                "Content-Type":
                                                    "application/json",
                                            },
                                        },
                                    );
                                    if (!r.ok) {
                                        throw new Error(
                                            "response did not succeed",
                                        );
                                    }
                                    alert("Operation OK");
                                } catch (e) {
                                    console.error("operation failed: ", e);
                                    alert("Failed");
                                }
                            }}
                        ></Button>
                        <Button
                            icon={<IconPlayerStop></IconPlayerStop>}
                            filledIcon={
                                <IconPlayerStopFilled></IconPlayerStopFilled>
                            }
                            text="Stop Instance"
                            onClick={async () => {
                                try {
                                    const r = await fetch(
                                        `${ENDPOINT}/api/v1/instance/stop`,
                                        {
                                            method: "POST",
                                            body: JSON.stringify({
                                                instance_id: parseInt(
                                                    instance_id ?? "",
                                                    10,
                                                ),
                                            }),
                                            headers: {
                                                "Content-Type":
                                                    "application/json",
                                            },
                                        },
                                    );
                                    if (!r.ok) {
                                        throw new Error(
                                            "response did not succeed",
                                        );
                                    }
                                    alert("Operation OK");
                                } catch (e) {
                                    console.error("operation failed: ", e);
                                    alert("Failed");
                                }
                            }}
                        ></Button>
                        <Button
                            icon={<IconSkull></IconSkull>}
                            filledIcon={<IconSkull></IconSkull>}
                            text="Force Kill"
                            onClick={async () => {
                                try {
                                    const r = await fetch(
                                        `${ENDPOINT}/api/v1/instance/kill`,
                                        {
                                            method: "POST",
                                            body: JSON.stringify({
                                                instance_id: parseInt(
                                                    instance_id ?? "",
                                                    10,
                                                ),
                                            }),
                                            headers: {
                                                "Content-Type":
                                                    "application/json",
                                            },
                                        },
                                    );
                                    if (!r.ok) {
                                        throw new Error(
                                            "response did not succeed",
                                        );
                                    }
                                    alert("Operation OK");
                                } catch (e) {
                                    console.error("operation failed: ", e);
                                    alert("Failed");
                                }
                            }}
                        ></Button>
                    </>
                )}
                {!exists && (
                    <>
                        <Button
                            icon={<IconPower></IconPower>}
                            filledIcon={<IconPower></IconPower>}
                            text="Start Instance"
                            variant="primary"
                            onClick={async () => {
                                try {
                                    const r = await fetch(
                                        `${ENDPOINT}/api/v1/instance/start`,
                                        {
                                            method: "POST",
                                            body: JSON.stringify({
                                                instance_id: parseInt(
                                                    instance_id ?? "",
                                                    10,
                                                ),
                                            }),
                                            headers: {
                                                "Content-Type":
                                                    "application/json",
                                            },
                                        },
                                    );
                                    if (!r.ok) {
                                        throw new Error(
                                            "response did not succeed",
                                        );
                                    }
                                    alert("Operation OK");
                                } catch (e) {
                                    console.error("operation failed: ", e);
                                    alert("Failed");
                                }
                            }}
                        ></Button>
                    </>
                )}
            </div>

            <div>
                <h2 className="text-2xl font-bold tracking-tight">
                    Instance Logs
                </h2>
                <p className="text-xs text-gray-700 leading-relaxed">
                    Monitor this instance by watching live logs.
                </p>
            </div>

            <div
                ref={logContainerRef}
                onScroll={handleScroll}
                className="px-2 py-2 rounded-md border border-black/15 dark:border-white/15 overflow-y-auto h-[40vh]"
            >
                {logs.map((v) => {
                    return (
                        <span key={v.line} className="block font-mono text-wrap rounded-md px-2 w-[100%] border border-transparent hover:border-black/15 dark:hover:border-white/15 hover:bg-black/2 dark:hover:bg-white/2 transition-colors cursor-pointer">
                            {v.content}
                        </span>
                    );
                })}
                {logs.length == 0 && (
                    <span className="block font-mono text-wrap rounded-md px-2 w-[100%] border border-transparent hover:border-black/15 dark:hover:border-white/15 hover:bg-black/2 dark:hover:bg-white/2 transition-colors cursor-pointer">
                        waiting for logs...
                    </span>
                )}
            </div>

            <div>
                <h2 className="text-2xl font-bold tracking-tight">
                    Extra Tools
                </h2>
                <p className="text-xs text-gray-700 leading-relaxed">
                    Other tools for managing your instances on this server
                </p>
            </div>

            <div className="flex gap-3 flex-wrap">
                <ToolFeatureCard
                    icon={
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            height="48px"
                            viewBox="0 -960 960 960"
                            width="48px"
                            fill="currentColor"
                        >
                            <path d="M160-160q-33 0-56.5-23.5T80-240v-480q0-33 23.5-56.5T160-800h640q33 0 56.5 23.5T880-720v480q0 33-23.5 56.5T800-160H160Zm0-80h640v-400H160v400Zm140-40-56-56 103-104-104-104 57-56 160 160-160 160Zm180 0v-80h240v80H480Z" />
                        </svg>
                    }
                    name="Terminal"
                    description="Interact with an SSH terminal directly within this page"
                ></ToolFeatureCard>

                <ToolFeatureCard
                    icon={
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            height="48px"
                            viewBox="0 -960 960 960"
                            width="48px"
                            fill="currentColor"
                        >
                            <path d="M686-132 444-376q-20 8-40.5 12t-43.5 4q-100 0-170-70t-70-170q0-36 10-68.5t28-61.5l146 146 72-72-146-146q29-18 61.5-28t68.5-10q100 0 170 70t70 170q0 23-4 43.5T584-516l244 242q12 12 12 29t-12 29l-84 84q-12 12-29 12t-29-12Z" />
                        </svg>
                    }
                    name="Configure"
                    description="Configure this instance for better integration with the control server."
                    onClick={() => {
                        navigate("/configure/" + instance_id);
                    }}
                ></ToolFeatureCard>
            </div>
        </div>
    );
}

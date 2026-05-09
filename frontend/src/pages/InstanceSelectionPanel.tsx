import { useEffect, useMemo } from "react";
import { Button } from "../components/Button";
import { useInstancesStore } from "../stores/InstancesStore";
import { Instance } from "./Instance";
import { StatisticsCard, type StatisticsData } from "./StatisticsCard";
import { IconPlus, IconPlusFilled } from "@tabler/icons-react";
import { InstancesService } from "../services/InstancesService";
import { useMetricsStore } from "../stores/MetricsStore";
import { MetricsService } from "../services/MetricsService";
import { useNavigate } from "react-router-dom";
import { useModalAsk } from "../components/Modal";
import { ConfigureInputItem } from "./configurePage/ConfigureInputItem";
import { useCreateInstanceState } from "../stores/CreateInstanceGlobalState";
import { ENDPOINT } from "../Config";


function formatBytes(bytes: number) {
    if (bytes === 0) return "0.0 B";

    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB", "TB"];

    const i = Math.floor(Math.log(bytes) / Math.log(k));
    const value = bytes / Math.pow(k, i);

    return `${value.toFixed(1)} ${sizes[i]}`;
}

export function InstanceSelectionPanel() {
    const instances = useInstancesStore((state) => state.instances);

    useEffect(() => {
        InstancesService.load();
    }, []);

    useEffect(() => {
        MetricsService.subscribe("system_metrics", -1);

        return () => {
            MetricsService.unsubscribe("system_metrics", -1);
        };
    }, []);

    const systemCpu = useMetricsStore((state) => state.systemCpu);
    const systemCpuPast = useMetricsStore((state) => state.systemCpuPast);
    const systemCpuChart: StatisticsData[] = useMemo(() => {
        const data: StatisticsData[] = [];
        for (const value of systemCpuPast) {
            data.push({ id: value.key, value: value.value });
        }
        return data;
    }, [systemCpuPast]);

    const systemMem = useMetricsStore((state) => state.systemMem);
    const systemMemTotal = useMetricsStore((state) => state.systemMemTotal);
    const systemMemPast = useMetricsStore((state) => state.systemMemPast);
    const systemMemChart: StatisticsData[] = useMemo(() => {
        const data: StatisticsData[] = [];
        for (const value of systemMemPast) {
            data.push({ id: value.key, value: value.value });
        }
        return data;
    }, [systemMemPast]);

    const systemSwap = useMetricsStore(state => state.systemSwap);
    const systemSwapTotal = useMetricsStore(state => state.systemSwapTotal);
    const systemSwapPast = useMetricsStore(state => state.systemSwapPast);
    const systemSwapChart: StatisticsData[] = useMemo(() => {
        const data: StatisticsData[] = [];
        for (const value of systemSwapPast) {
            data.push({ id: value.key, value: value.value });
        }
        return data;
    }, [systemSwapPast]);

    const {ask, ModalRenderer} = useModalAsk();
    

    const onCreateInstanceClicked = async () => {

        useCreateInstanceState.setState({currentValue: ""});

        const result = await ask({
            "buttons": [{
                "id": "create",
                "text": "Create",
                "icon": <IconPlus></IconPlus>
            }, {
                "id": "cancel",
                "text": "Cancel"
            }],
            "modalContent": (<div className="flex flex-col gap-3">
                <h1 className="font-bold text-2xl tracking-tight">Create a new instance</h1>
                <ConfigureInputItem onChange={(e) => {
                    console.log("it changes");
                    useCreateInstanceState.setState({currentValue: e.target.value})
                }}></ConfigureInputItem>
            </div>)
        });

        if (result === "cancel") {
            return;
        }

        const inputValue = useCreateInstanceState.getState().currentValue;
        if (!inputValue) {
            alert("Invalid name");
            return;
        }

        console.log("Create");
        // alert("Create: " + inputValue);
        
        try {
            const res = await fetch(`${ENDPOINT}/api/v1/instance/create`, {
                method: 'POST',
                body: JSON.stringify({
                    "name": inputValue
                }),
                headers: {
                    "Content-Type": "application/json"
                }
            });

            if (res.ok) {
                await InstancesService.load();
                alert("Instance created successfully!");
            } else {
                throw new Error("Response did not succeed");
            }
        } catch (e) {
            console.error("Failed to create instance: ", e);
            alert("Instance creation failed");
        }
    }

    const navigate = useNavigate();

    return (
        <div className="w-full h-full px-4 py-4 flex flex-col gap-6">
            <ModalRenderer></ModalRenderer>
            <div className="flex flex-col gap-3 mt-15">
                <h1 className="text-3xl font-semibold tracking-tight">
                    System Resources
                </h1>
                <p className="text-gray-700 leading-relaxed max-w-[40vw]">
                    View total system resources being used, including all system
                    processes and all resources used by your instances.
                </p>
            </div>

            <div className="flex gap-3">
                <StatisticsCard
                    data={systemCpuChart}
                    max={100}
                    name="CPU"
                    description="System processor CPU usage, averaged across all cores (%)"
                    currentValue={`${Math.round(systemCpu)}%`}
                    color="#6366f1"
                    maxHuman="100%"
                ></StatisticsCard>
                <StatisticsCard
                    data={systemMemChart}
                    max={systemMemTotal}
                    name="RAM"
                    description="Memory usage used by all applications currently running (GB)"
                    currentValue={`${formatBytes(systemMem)}`}
                    color="#00df77"
                    maxHuman={`${formatBytes(systemMemTotal)}`}
                ></StatisticsCard>
                <StatisticsCard
                    data={systemSwapChart}
                    max={systemSwapTotal}
                    name="Swap"
                    description="Swap usage by the entire system"
                    currentValue={`${formatBytes(systemSwap)}`}
                    maxHuman={`${formatBytes(systemSwapTotal)}`}
                    color="#0059df"
                ></StatisticsCard>
            </div>

            <div className="flex flex-col gap-3">
                <h1 className="text-3xl font-semibold tracking-tight">
                    Server Instances
                </h1>
                <p className="text-gray-700 leading-relaxed max-w-[40vw]">
                    With the introduction of Minecraft Server Control V3,
                    managing multiple instances is now supported. To continue,
                    please create or select an existing instance to manage or
                    configure.
                </p>
            </div>

            <div>
                <Button
                    variant="primary"
                    icon={<IconPlus></IconPlus>}
                    filledIcon={<IconPlusFilled></IconPlusFilled>}
                    text="Create Instance"
                    onClick={onCreateInstanceClicked}
                ></Button>
            </div>

            <div className="flex gap-4 flex-wrap">
                {instances.map((v) => {
                    return (
                        <Instance name={v.name} id={v.id} key={v.id} onClick={() => {
                            navigate("/manage/" +  v.id)
                        }}></Instance>
                    );
                })}
            </div>
        </div>
    );
}

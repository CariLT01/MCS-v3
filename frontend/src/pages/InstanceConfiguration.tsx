import {
    IconAlertTriangle,
    IconCheck,
    IconCheckFilled,
    IconX,
    IconXFilled,
} from "@tabler/icons-react";
import { Button } from "../components/Button";
import { SectionTitle } from "../components/SectionTitle";
import { SectionTitleSmall } from "../components/SectionTitleSmall";
import { ConfigureInputItem } from "./configurePage/ConfigureInputItem";
import { ConfigureItem } from "./configurePage/ConfigureItem";
import { useEffect, useRef, useState } from "react";
import { ENDPOINT } from "../Config";
import { useNavigate, useParams } from "react-router-dom";
import { Card } from "../components/Card";

/*
            "server_directory": instance.server_directory,
            "home_directory": instance.home_directory,
            "java_process": instance.java_process,
            "java_args_path": instance.java_args_path,
            "logs_path": instance.logs_path,
            "start_file": instance.start_file
*/

type Response = {
    server_directory: string | null;
    home_directory: string | null;
    java_process: string | null;
    java_args_path: string | null;
    logs_path: string | null;
    start_file: string | null;
    screen_name: string | null;
};
type Request = {
    server_directory: string;
    home_directory: string;
    java_process: string;
    java_args_path: string;
    logs_path: string;
    start_file: string;
    instance_id: number;
    screen_name: string;
};

export function InstanceConfiguration() {
    const { instance_id } = useParams();

    const [serverDir, setServerDir] = useState<string>("");
    const [homeDir, setHomeDir] = useState<string>("");

    const [javaProcess, setJavaProcess] = useState<string>("");
    const [jvmArgsPath, setJvmArgsPath] = useState<string>("");
    const [latestLogPath, setLatestLogPath] = useState<string>("");
    const [startFile, setStartFile] = useState<string>("");
    const [screenName, setScreenName] = useState<string>("");

    const serverDirRef = useRef<HTMLInputElement>(null);
    const homeDirRef = useRef<HTMLInputElement>(null);
    const javaProcessRef = useRef<HTMLInputElement>(null);
    const jvmArgsPathRef = useRef<HTMLInputElement>(null);
    const latestLogPathRef = useRef<HTMLInputElement>(null);
    const startFileRef = useRef<HTMLInputElement>(null);
    const screenNameRef = useRef<HTMLInputElement>(null);

    const navigate = useNavigate();

    useEffect(() => {
        if (!instance_id) return;

        (async () => {
            const res = await fetch(
                `${ENDPOINT}/api/v1/instance/get_config?instance_id=${instance_id}`,
            );
            if (!res.ok) {
                throw new Error("Failed to load config");
            }
            const data: Response = await res.json();

            setServerDir(data.server_directory ?? "");
            setHomeDir(data.home_directory ?? "");
            setJavaProcess(data.java_process ?? "");
            setJvmArgsPath(data.java_args_path ?? "");
            setLatestLogPath(data.logs_path ?? "");
            setStartFile(data.start_file ?? "");
            setScreenName(data.screen_name ?? "");
        })();
    }, [instance_id]);

    return (
        <div className="flex flex-col gap-6 px-4 py-4">
            <SectionTitle
                title="Configure Instance"
                description="Configure your instance settings"
            />

            <SectionTitleSmall
                title="Directory Information"
                description="Directory info to get started"
            />

            <div className="flex flex-col border border-black/15 rounded-md overflow-hidden">
                <ConfigureItem
                    label="Server Directory"
                    description="Path to the folder where your server is located"
                >
                    <ConfigureInputItem
                        ref={serverDirRef}
                        value={serverDir}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                            setServerDir(e.target.value)
                        }
                        placeholder="<no value set>"
                    />
                </ConfigureItem>

                <ConfigureItem
                    label="Home Directory"
                    description="Path to your home folder"
                >
                    <ConfigureInputItem
                        ref={homeDirRef}
                        value={homeDir}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                            setHomeDir(e.target.value)
                        }
                        placeholder="<no value set>"
                    />
                </ConfigureItem>
            </div>

            <SectionTitleSmall
                title="Server Info"
                description="Java process string, start command, JVM args, and etc."
            />

            <div className="flex flex-col border border-black/15 rounded-md overflow-hidden">
                <ConfigureItem
                    label="Java process"
                    description="This string is searched for in the process list"
                >
                    <ConfigureInputItem
                        ref={javaProcessRef}
                        value={javaProcess}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                            setJavaProcess(e.target.value)
                        }
                        placeholder="<no value set>"
                    />
                </ConfigureItem>

                <ConfigureItem
                    label="JVM Args Path"
                    description="The path to your JVM arguments text file"
                >
                    <ConfigureInputItem
                        ref={jvmArgsPathRef}
                        value={jvmArgsPath}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                            setJvmArgsPath(e.target.value)
                        }
                        placeholder="<no value set>"
                    />
                </ConfigureItem>

                <ConfigureItem
                    label="Latest.log Path"
                    description="Path to your latest.log server log files in the Minecraft server directory"
                >
                    <ConfigureInputItem
                        ref={latestLogPathRef}
                        value={latestLogPath}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                            setLatestLogPath(e.target.value)
                        }
                        placeholder="<no value set>"
                    />
                </ConfigureItem>

                <ConfigureItem
                    label="Server Start Bash File"
                    description="The bash file used to start your Minecraft server"
                >
                    <ConfigureInputItem
                        ref={startFileRef}
                        value={startFile}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                            setStartFile(e.target.value)
                        }
                        placeholder="<no value set>"
                    />
                </ConfigureItem>

                <ConfigureItem
                    label="Screen Session Name"
                    description="The screen session name for the screen utility used in Linux"
                >
                    <ConfigureInputItem
                        ref={screenNameRef}
                        value={screenName}
                        onChange={(e) => {
                            setScreenName(e.target.value);
                        }}
                        placeholder="<no value set>"
                    ></ConfigureInputItem>
                </ConfigureItem>
            </div>

            <div className="w-full flex gap-3">
                <Button
                    variant="primary"
                    text="Apply Changes"
                    icon={<IconCheck />}
                    filledIcon={<IconCheckFilled />}
                    onClick={() => {
                        // example access via state or refs
                        console.log({
                            serverDir,
                            homeDir,
                            javaProcess,
                            jvmArgsPath,
                            latestLogPath,
                            startFile,
                        });

                        const obj: Request = {
                            server_directory: serverDir,
                            home_directory: homeDir,
                            java_args_path: jvmArgsPath,
                            java_process: javaProcess,
                            logs_path: latestLogPath,
                            start_file: startFile,
                            instance_id: parseInt(instance_id ?? "", 10),
                            screen_name: screenName
                        };

                        (async () => {
                            const res = await fetch(
                                `${ENDPOINT}/api/v1/instance/set_config`,
                                {
                                    method: "POST",
                                    body: JSON.stringify(obj),
                                    headers: {
                                        "Content-Type": "application/json",
                                    },
                                },
                            );
                            if (!res.ok) {
                                alert("Failed to save config");
                                return;
                            }
                            alert("Saved!");
                            navigate(`/manage/${instance_id}`);
                        })();
                    }}
                />

                <Button
                    variant="secondary"
                    text="Discard"
                    icon={<IconX />}
                    filledIcon={<IconXFilled />}
                    onClick={() => {
                        if (
                            !confirm(
                                "Are you sure you want to discard all changes?",
                            )
                        )
                            return;
                        setServerDir("");
                        setHomeDir("");
                        setJavaProcess("");
                        setJvmArgsPath("");
                        setLatestLogPath("");
                        setStartFile("");
                        setScreenName("");
                        navigate(`/manage/${instance_id}`);
                    }}
                />
            </div>

            <Card additionalClasses="flex gap-3 items-center">
                <IconAlertTriangle size={48}></IconAlertTriangle>
                <div>
                    <strong className="font-bold leading-relaxed">
                        Config may not apply until the control server
                        restarts.{" "}
                    </strong>
                    <p className="text-gray-700 leading-relaxed">
                        Many config values are cached for performance to avoid
                        excess database reads. Restart the Minecraft Server
                        Control application to purge cache.
                    </p>
                </div>
            </Card>
        </div>
    );
}

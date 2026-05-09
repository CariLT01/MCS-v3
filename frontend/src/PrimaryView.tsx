import type { ReactNode } from "react";
import type { Tab } from "./TabTypes";
import { TabButton } from "./TabButton";

interface Props {
    tabs: Tab[];
    children: ReactNode;
}

export function PrimaryView(props: Props) {
    return (
        <div className="w-full h-full flex">
            <nav className="h-full px-2 py-2 flex flex-col gap-3 w-50 border-r border-r-black/15 dark:border-r-white/15 hidden">
                <h1 className="text-3xl font-bold tracking-tight">
                    Minecraft Server Control
                </h1>
                <div className="flex flex-col">
                    {props.tabs.map((tabData) => {
                        return (
                            <TabButton
                                key={tabData.name}
                                tab={tabData}
                            ></TabButton>
                        );
                    })}
                </div>
            </nav>
            <div className="h-full flex-grow-1 overflow-x-hidden overflow-y-auto">
                {props.children}
            </div>
        </div>
    );
}

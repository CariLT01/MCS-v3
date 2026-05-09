import { useState } from "react";
import type { Tab } from "./TabTypes";

interface Props {
    tab: Tab;
}

export function TabButton(props: Props) {
    const [hovered, setHovered] = useState<boolean>(false);

    return (
        <button
            className="px-2 py-2 rounded-md hover:bg-black/5 cursor-pointer font-bold flex gap-3"
            onClick={() => {
                props.tab.onClick(props.tab.name);
            }}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
        >
            <div>
                {!hovered && props.tab.icon}
                {hovered && props.tab.filledIcon}
            </div>
            <span className="font-bold">{props.tab.displayedName}</span>
        </button>
    );
}

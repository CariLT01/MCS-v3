import type { ReactNode } from "react";
import { Card } from "../components/Card";

interface Props {
    icon: ReactNode;
    name: string;
    description: string;
    onClick?: () => void;
}

export function ToolFeatureCard(props: Props) {
    return (
        <Card additionalClasses="flex flex-col gap-4 w-100 h-full">
            <div className="flex flex-col gap-2">
                {props.icon}

                <h3 className="font-semibold tracking-tight text-xl">
                    {props.name}
                </h3>
                <p className="text-gray-700 leading-relaxed">
                    {props.description}
                </p>
            </div>

            <button onClick={props.onClick} className="px-2 py-2 rounded-md border border-black/15 rounded:border-white/15 font-semibold cursor-pointer hover:bg-black/5 dark:hover:bg-white/5">
                Open
            </button>
        </Card>
    );
}

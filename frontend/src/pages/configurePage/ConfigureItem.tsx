import type { ReactNode } from "react";

interface Props {
    children: ReactNode;
    label: string;
    description?: string;
}

export function ConfigureItem(props: Props) {
    return <div className="w-full p-4 border-b border-black/15 flex flex-col gap-2 last:border-b-0">
        <div>
            <p className="font-semibold tracking-tight text-lg">{props.label}</p>
            {props.description && <p className="text-gray-700 leading-relaxed text-sm">{props.description}</p>}
        </div>
        
        <div>
            {props.children}
        </div>
    </div>
}
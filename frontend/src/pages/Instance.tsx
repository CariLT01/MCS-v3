import { IconTool } from "@tabler/icons-react";
import { Button } from "../components/Button";
import { Card } from "../components/Card";

interface Props {
    name: string;
    id: number;
    onClick?: (id: number) => void;
}

export function Instance(props: Props) {
    return <Card additionalClasses="flex flex-col gap-3">
        <h3 className="font-bold tracking-tight text-2xl">{props.name}</h3>
        <p className="text-gray-700 leading-relaxed">Minecraft Server Instance</p>

        <Button text="Manage" icon={<IconTool></IconTool>} onClick={() => {
            if (!props.onClick) return;
            props.onClick(props.id);
        }}></Button>
    </Card>
}
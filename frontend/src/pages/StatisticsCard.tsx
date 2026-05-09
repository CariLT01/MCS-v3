import { Area, AreaChart, Line, ResponsiveContainer, YAxis } from "recharts";
import { Card } from "../components/Card";

export type StatisticsData = {
    id: number;
    value: number;
};

interface Props {
    data: StatisticsData[];
    name: string;
    description: string;
    currentValue: string;
    color: string;
    max: number;
    maxHuman: string;
}

export function StatisticsCard(props: Props) {
    return (
        <Card additionalClasses="flex flex-col gap-3 p-0! py-2! w-100">
            <div className="flex flex-col gap-3">
                <div className="flex flex-col gap-1 px-2">
                    <div>
                        <div className="flex justify-between items-center">
                            <h3 className="text-2xl font-semibold tracking-tight">
                                {props.name}
                            </h3>

                            <p className="text-2xl font-mono bg-gray-200 px-2 rounded-md h-fit">
                                {props.currentValue}
                            </p>
                        </div>
                        <span className="text-xs text-gray-700">
                            {props.maxHuman}
                        </span>
                    </div>

                    <p className="text-xs text-gray-700 leading-relaxed">
                        {props.description}
                    </p>
                </div>

                <div className="h-40">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={props.data}>
                            <defs>
                                <linearGradient
                                    id={`${props.name}Gradient`}
                                    x1="0"
                                    y1="0"
                                    x2="0"
                                    y2="1"
                                >
                                    <stop
                                        offset="0%"
                                        stopColor={props.color}
                                        stopOpacity={0.8}
                                    />
                                    <stop
                                        offset="100%"
                                        stopColor={props.color}
                                        stopOpacity={0}
                                    />
                                </linearGradient>
                            </defs>

                            <YAxis domain={[0, props.max]} hide />

                            <Area
                                type="monotone"
                                dataKey="value"
                                stroke="none"
                                fill={`url(#${props.name}Gradient)`}
                                isAnimationActive={false}
                            />

                            <Line
                                type="monotone"
                                dataKey="value"
                                stroke={props.color}
                                strokeWidth={2}
                                dot={false}
                                isAnimationActive={false}
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </Card>
    );
}

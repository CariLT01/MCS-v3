interface Props {
    title: string;
    description: string;
}

export function SectionTitleSmall(props: Props) {
    return (
        <div>
            <h2 className="text-2xl font-bold tracking-tight">
                {props.title}
            </h2>
            <p className="text-xs text-gray-700 leading-relaxed">
                {props.description}
            </p>
        </div>
    );
}

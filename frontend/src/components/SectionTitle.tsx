import clsx from "clsx";

interface Props {
    additionalClasses?: string;

    title: string;
    description: string;
}

export function SectionTitle(props: Props) {

    const classes = clsx(
        "flex flex-col gap-3",
        props.additionalClasses
    )

    return (
        <div className={classes}>
            <h1 className="text-3xl font-semibold tracking-tight">
                {props.title}
            </h1>
            <p className="text-gray-700 leading-relaxed max-w-[40vw]">
                {props.description}
            </p>
        </div>
    );
}

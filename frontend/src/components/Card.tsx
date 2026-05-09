import clsx from "clsx";
import type { ReactNode } from "react";

interface Props {
    children: ReactNode;
    additionalClasses?: string;
}

export function Card(props: Props) {

    const classes = clsx(
        "px-6 py-6 rounded-md border border-black/15 dark:border-white/15",
        props.additionalClasses
    );

    return <div className={classes}>
        {props.children}
    </div>
}
import clsx from "clsx";
import { useState, type ReactNode } from "react";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: "primary" | "secondary";
    text: string;
    icon?: ReactNode;
    filledIcon?: ReactNode;
};

export function Button({ variant, text, icon, filledIcon, ...props }: ButtonProps) {


    const [hovered, setHovered] = useState<boolean>(false);

    const buttonClasses = clsx(
        "flex gap-3 items-center rounded-md px-2 py-2 font-semibold cursor-pointer transition-colors", // base classes
        variant == "primary"
            ? "bg-black dark:bg-white hover:bg-black/75 active:bg-black/65 dark:hover:bg-white/75 dark:active:bg-white/65 text-white dark:text-black"
            : "bg-transparent hover:bg-black/5 active:bg-black/10 dark:hover:bg-white/5 dark:active:bg-white/10 border border-black/15 dark:border-white/15",
    );

    return (
        <button className={buttonClasses} {...props} onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}>
            {icon && <div>
                {(hovered) && (filledIcon ? filledIcon : icon)}
                {(!hovered) && icon}
            </div>}
            {text}
        </button>
    );
}

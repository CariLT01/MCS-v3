
type Props = React.InputHTMLAttributes<HTMLInputElement> & {
    ref?: React.Ref<HTMLInputElement>;
};

export function ConfigureInputItem(props: Props) {
    return (
        <input
            className="w-full p-2 rounded-md border border-black/15 dark:border-white/15 focus:outline-none focus:border-black/35 dark:focus:border-white/35"
            {...props}
        ></input>
    );
}

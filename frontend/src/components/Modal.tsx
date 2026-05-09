import { useState, type ReactNode } from "react";
import { Button } from "./Button";
import { createPortal } from "react-dom";

type ModalButton = {
    id: string;
    text: string;
    icon?: ReactNode;
    filledIcon?: ReactNode;
};

type AskOptions = {
    modalContent: ReactNode;
    buttons: ModalButton[];
};

type ModalState = AskOptions & {
    resolve: (id: string) => void;
};

export function useModalAsk() {
    const [modal, setModal] = useState<ModalState | null>(null);

    async function ask(options: AskOptions): Promise<string> {
        return new Promise((resolve) => {
            setModal({
                ...options,
                resolve,
            });
        });
    }

    function ModalRenderer() {
        if (!modal) {
            return null;
        }

        return createPortal(
            <div className="fixed inset-0 flex justify-center items-center z-[9999] bg-black/50">
                <div className="p-4 bg-white dark:bg-black rounded-md shadow-lg border border-black/15 dark:border-white/15 flex flex-col gap-6">
                    {modal.modalContent}

                    <div className="w-full flex justify-center">
                        <div className="flex gap-3">
                            {modal.buttons.map((btn) => (
                                <Button
                                    key={btn.id}
                                    icon={btn.icon}
                                    filledIcon={btn.filledIcon}
                                    text={btn.text}
                                    onClick={() => {
                                        modal.resolve(btn.id);
                                        setModal(null);
                                    }}
                                />
                            ))}
                        </div>
                    </div>
                </div>
            </div>,
            document.body,
        );
    }

    return {
        ask,
        ModalRenderer,
    };
}
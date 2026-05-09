import type { ReactNode } from "react";
import type { useModalAsk } from "./Modal";

export async function confirm(
    ask: ReturnType<typeof useModalAsk>["ask"],
    content: ReactNode
) {
    const result = await ask({
        modalContent: content,
        buttons: [{
            id: "cancel",
            text: "Cancel"
        },{
            id: "confirm",
            text: "Confirm"
        }]
    });

    return result === "confirm";
}
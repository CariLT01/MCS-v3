import { create } from "zustand";

// too lazy to really fix, let's just put a global state for a simple modal
interface CreateInstanceState {
    currentValue: string;
    setCurrentValue: (v: string) => void;
}

export const useCreateInstanceState = create<CreateInstanceState>((set) => {
    return {
        currentValue: "",
        setCurrentValue: (v) => set({currentValue: v})
    }
});
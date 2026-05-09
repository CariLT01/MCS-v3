import { create } from "zustand";

interface InstancesManagementStore {
    lastId: string;
    setLastId: (s: string) => void;
}

export const useInstanceManagementStore = create<InstancesManagementStore>((set) => {
    return {
        lastId: "",
        setLastId: (v) => set({"lastId": v})
    }
});
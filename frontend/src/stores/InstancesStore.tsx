import { create } from "zustand";

export type ServerInstance = {
    name: string;
    id: number;
}

interface InstancesStore {
    instances: ServerInstance[];
    setInstances: (instances: ServerInstance[]) => void;
}

export const useInstancesStore = create<InstancesStore>((set) => {
    return {
        instances: [],
        setInstances: (insts) => {
            set({instances: insts})
        }
    }
});
import { create } from "zustand";
import type { CurrentPageTabData } from "../TabTypes";



interface CurrentPageDataStore {
    currentPage: string;
    setCurrentPage: (currentPage: string) => void;
    currentTabs: CurrentPageTabData[];
    setCurrentTabs: (tabs: CurrentPageTabData[]) => void;
}

export const useCurrentPageDataStore = create<CurrentPageDataStore>((set) => {
    return {
        currentPage: "home",
        setCurrentPage: (currentPage) => {
            set({ currentPage: currentPage });
        },
        currentTabs: [],
        setCurrentTabs: (tabs) => {
            set({ currentTabs: tabs });
        },
    };
});

import type { ReactNode } from "react";

export type Tab = {
    name: string;
    icon: ReactNode;
    displayedName: string;
    filledIcon: ReactNode;
    onClick: (tabName: string) => void;
}

export type CurrentPageTabData = {
    navigateTo: string;
    tabName: string;
    displayedName: string;
    icon: ReactNode;
    filledIcon: ReactNode;
};
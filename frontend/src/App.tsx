import { Route, Routes, useLocation, useNavigate } from "react-router-dom";
import { PrimaryView } from "./PrimaryView";
import type { Tab } from "./TabTypes";
import { useEffect, useMemo } from "react";
import { useCurrentPageDataStore } from "./stores/CurrentPageData";
import { TabConstants } from "./TabConstants";
import { InstanceSelectionPanel } from "./pages/InstanceSelectionPanel";
import { InstanceManagementPanel } from "./pages/InstanceManagementPanel";
import { InstanceConfiguration } from "./pages/InstanceConfiguration";
import { MetricsService } from "./services/MetricsService";

function App() {
    const location = useLocation();
    const navigate = useNavigate();

    const tabsRaw = useCurrentPageDataStore((state) => state.currentTabs);
    const tabsSetCurrentTabs = useCurrentPageDataStore(
        (state) => state.setCurrentTabs,
    );

    const tabsData: Tab[] = useMemo(() => {
        const tabData: Tab[] = [];

        for (const tab of tabsRaw) {
            tabData.push({
                displayedName: tab.displayedName,
                icon: tab.icon,
                name: tab.tabName,
                onClick: () => {
                    navigate(tab.navigateTo);
                },
                filledIcon: tab.filledIcon,
            });
        }
        return tabData;
    }, [tabsRaw, navigate]);

    useEffect(() => {
        const tabData = TabConstants[location.pathname];
        if (!tabData) {
            tabsSetCurrentTabs([]);
        } else {
            tabsSetCurrentTabs(tabData);
        }
    }, [location, tabsSetCurrentTabs]);

    useEffect(() => {
        MetricsService.connect();
    }, []);

    return (
        <div className="w-[100vw] h-[100vh]">
            <PrimaryView tabs={tabsData}>
                <Routes>
                    <Route path="/" element={<InstanceSelectionPanel></InstanceSelectionPanel>}></Route>
                    <Route path="/manage/:instance_id" element={<InstanceManagementPanel></InstanceManagementPanel>}></Route>
                    <Route path="/configure/:instance_id" element={<InstanceConfiguration></InstanceConfiguration>}></Route>
                </Routes>
            </PrimaryView>
        </div>
    );
}

export default App;

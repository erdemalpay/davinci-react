import React, {
  PropsWithChildren,
  createContext,
  useContext,
  useEffect,
} from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useGeneralContext } from "../../../context/General.context";
import useIsLargeScreen from "../../../hooks/useIsLargeScreen";
import { getTabSlug } from "../../../utils/slug";
import { Tab } from "../shared/types";
import { OrientationToggle } from "./OrientationToggle";
import TabPanel from "./TabPanel";
import VerticalTabPanel from "./VerticalTabPanel";

const TAB_QUERY_PARAM = "tab";

const resolveTabIndex = (tabValue: number, tabs: Tab[]) => {
  const byAdjustedIndex = tabs.findIndex((_, index) => index === tabValue);
  if (byAdjustedIndex !== -1) {
    return byAdjustedIndex;
  }

  return tabs.findIndex((tab) => tab.number === tabValue);
};

// TabPanel için local context
type TabPanelContextType = {
  allowOrientationToggle: boolean;
};

const TabPanelContext = createContext<TabPanelContextType>({
  allowOrientationToggle: false,
});

export const useTabPanelContext = () => useContext(TabPanelContext);

const TabPanelProvider = ({
  children,
  allowOrientationToggle = false,
}: PropsWithChildren<{ allowOrientationToggle?: boolean }>) => {
  return (
    <TabPanelContext.Provider value={{ allowOrientationToggle }}>
      {children}
    </TabPanelContext.Provider>
  );
};

type Props = {
  tabs: Tab[];
  activeTab: number;
  setActiveTab: (tab: number) => void;
  additionalClickAction?: () => void;
  additionalOpenAction?: () => void;
  topClassName?: string;
  filters?: React.ReactNode[];
  isLanguageChange?: boolean;
  sideClassName?: string;
  allowOrientationToggle?: boolean;
  injectOrientationToggleToFilters?: boolean;
  disableLanguageChange?: boolean;
};

const UnifiedTabPanel: React.FC<Props> = ({
  allowOrientationToggle = false,
  filters,
  injectOrientationToggleToFilters = false,
  disableLanguageChange = false,
  activeTab,
  setActiveTab,
  ...props
}) => {
  const { tabOrientation, setTabOrientation } = useGeneralContext();
  const location = useLocation();
  const navigate = useNavigate();
  const isLargeScreen = useIsLargeScreen();
  const visibleTabs = React.useMemo(
    () => props.tabs.filter((tab) => !tab.isDisabled),
    [props.tabs]
  );

  const currentTabIndex = React.useMemo(
    () => resolveTabIndex(activeTab, visibleTabs),
    [activeTab, visibleTabs]
  );

  // Mobile'da her zaman horizontal
  const actualOrientation = !isLargeScreen ? "horizontal" : tabOrientation;

  const TabComponent =
    actualOrientation === "vertical" ? VerticalTabPanel : TabPanel;

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const tabParam = searchParams.get(TAB_QUERY_PARAM);
    const currentTab = visibleTabs[currentTabIndex] ?? visibleTabs[0] ?? null;

    if (!currentTab) {
      return;
    }

    const currentTabSlug = getTabSlug(currentTab.label);

    if (tabParam === null) {
      searchParams.set(TAB_QUERY_PARAM, currentTabSlug);
      navigate(
        {
          pathname: location.pathname,
          search: `?${searchParams.toString()}`,
        },
        { replace: true }
      );
      return;
    }

    const nextTabIndex = visibleTabs.findIndex(
      (tab) => getTabSlug(tab.label) === tabParam
    );

    if (nextTabIndex !== -1 && nextTabIndex !== currentTabIndex) {
      setActiveTab(nextTabIndex);
      return;
    }

    if (nextTabIndex === -1 && tabParam !== currentTabSlug) {
      searchParams.set(TAB_QUERY_PARAM, currentTabSlug);
      navigate(
        {
          pathname: location.pathname,
          search: `?${searchParams.toString()}`,
        },
        { replace: true }
      );
    }
  }, [
    activeTab,
    currentTabIndex,
    location.pathname,
    location.search,
    navigate,
    setActiveTab,
    visibleTabs,
  ]);

  const handleSetActiveTab = (tab: number) => {
    setActiveTab(tab);

    const nextTab = visibleTabs[tab] ?? visibleTabs[0];
    if (!nextTab) {
      return;
    }

    const searchParams = new URLSearchParams(location.search);
    searchParams.set(TAB_QUERY_PARAM, getTabSlug(nextTab.label));

    navigate({
      pathname: location.pathname,
      search: `?${searchParams.toString()}`,
    });
  };

  // Toggle button'ı filter'ların başına ekle (yalnızca açıkça istenirse)
  const enhancedFilters = React.useMemo(() => {
    if (!injectOrientationToggleToFilters) return filters;

    if (!allowOrientationToggle || !isLargeScreen) {
      return filters;
    }

    const toggleButton = (
      <OrientationToggle
        key="orientation-toggle"
        orientation={tabOrientation}
        onChange={setTabOrientation}
      />
    );

    // Toggle button'ı her zaman en başa ekle (sağda ilk eleman olacak)
    return filters ? [toggleButton, ...filters] : [toggleButton];
  }, [
    allowOrientationToggle,
    isLargeScreen,
    tabOrientation,
    setTabOrientation,
    filters,
  ]);

  return (
    <TabPanelProvider allowOrientationToggle={allowOrientationToggle}>
      <TabComponent
        {...props}
        activeTab={activeTab}
        setActiveTab={handleSetActiveTab}
        filters={enhancedFilters}
        isLanguageChange={
          disableLanguageChange ? false : props.isLanguageChange
        }
      />
    </TabPanelProvider>
  );
};

export default UnifiedTabPanel;

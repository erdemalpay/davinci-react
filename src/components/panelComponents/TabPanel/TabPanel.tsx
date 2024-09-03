import React, { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useGeneralContext } from "../../../context/General.context";
import "../../../index.css";
import { P1 } from "../Typography";
import { Tab } from "../shared/types";
// active tab is required to be outside so that when the item added into the tab and tabpanel is rerendered, the active tab will not be reset.
type Props = {
  tabs: Tab[];
  activeTab: number;
  setActiveTab: (tab: number) => void;
  additionalClickAction?: () => void;
  additionalOpenAction?: () => void;
  topClassName?: string;
};

const TabPanel: React.FC<Props> = ({
  additionalClickAction,
  tabs,
  activeTab,
  setActiveTab,
  additionalOpenAction,
  topClassName,
}) => {
  const { t } = useTranslation();
  const adjustedTabs = tabs
    .filter((item) => !item.isDisabled)
    .map((tab, index) => {
      return {
        ...tab,
        number: index,
      };
    });

  const [indicatorStyle, setIndicatorStyle] = useState<{
    width: number;
    left: number;
  }>({ width: 0, left: 0 });
  const tabsRef = useRef<(HTMLDivElement | null)[]>([]);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const { i18n } = useTranslation();
  const { setSortConfigKey, setExpandedRows } = useGeneralContext();
  useEffect(() => {
    additionalOpenAction?.();
    if (tabsRef.current[activeTab] && containerRef.current) {
      const activeTabElement = tabsRef.current[activeTab];
      const { offsetLeft, offsetWidth } = activeTabElement!;
      setIndicatorStyle({ width: offsetWidth, left: offsetLeft });
      const leftScrollPosition =
        activeTabElement!.offsetLeft +
        activeTabElement!.offsetWidth / 2 -
        containerRef.current.offsetWidth / 2;
      containerRef.current.scroll({
        left: leftScrollPosition,
        behavior: "smooth",
      });
    }

    if (
      !adjustedTabs.find((tab) => tab.number === activeTab) &&
      tabs?.filter((tab) => tab.isDisabled)?.length > 0
    ) {
      setActiveTab(tabs[0]?.number);
    }
  }, [activeTab, tabs.length, i18n.language]);

  const handleTabChange = (tab: Tab) => {
    additionalClickAction && additionalClickAction();
    setSortConfigKey(null);
    setExpandedRows({});
    setActiveTab(tab.number);
  };

  return (
    <div
      className={` flex flex-col border h-max rounded-lg border-gray-200 bg-white w-[98%] mx-auto __className_a182b8 ${
        topClassName ? topClassName : "my-6"
      }`}
    >
      <div
        ref={containerRef}
        className={`flex flex-row  border-b relative overflow-x-auto scroll-auto scrollbar-hide ${
          topClassName ? "py-5" : "py-6"
        }`}
      >
        {adjustedTabs
          .filter((tab) => !tab.isDisabled)
          .map((tab, index) => (
            <div
              key={index}
              ref={(el) => (tabsRef.current[index] = el)}
              className={`px-4  flex flex-row items-center gap-2 cursor-pointer ${
                activeTab === tab.number ? "text-blue-500" : ""
              }`}
              onClick={() => handleTabChange(tab)}
            >
              {tab.icon}
              <P1 className="w-max">{t(tab.label)}</P1>
            </div>
          ))}
        <div
          className="absolute bottom-0 h-0.5 bg-blue-500 transition-all duration-300"
          style={{
            width: `${indicatorStyle.width}px`,
            transform: `translateX(${indicatorStyle.left}px)`,
          }}
        />
      </div>
      {adjustedTabs.find((tab) => tab.number === activeTab)?.content &&
        !adjustedTabs.find((tab) => tab.number === activeTab)?.isDisabled && (
          <div className={`${topClassName ? "pt-3" : "py-6"}`}>
            {adjustedTabs.find((tab) => tab.number === activeTab)?.content}
          </div>
        )}
    </div>
  );
};

export default TabPanel;

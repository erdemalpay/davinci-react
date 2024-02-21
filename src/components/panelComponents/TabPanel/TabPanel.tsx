import React, { useEffect, useRef, useState } from "react";
import { P1 } from "../Typography";
import { Tab } from "../shared/types";

type Props = {
  tabs: Tab[];
};

const TabPanel: React.FC<Props> = ({ tabs }) => {
  const [activeTab, setActiveTab] = useState<number>(0);
  const [indicatorStyle, setIndicatorStyle] = useState<{
    width: number;
    left: number;
  }>({ width: 0, left: 0 });
  const tabsRef = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    if (tabsRef.current[activeTab]) {
      const activeTabElement = tabsRef.current[activeTab];
      const { offsetLeft, offsetWidth } = activeTabElement!;
      setIndicatorStyle({
        width: offsetWidth,
        left: offsetLeft,
      });
    }
  }, [activeTab, tabs.length]);

  const handleTabChange = (tab: Tab) => {
    setActiveTab(tab.number);
  };

  return (
    <div className="mt-10 flex flex-col border rounded-lg border-gray-200 bg-white w-5/6 mx-auto">
      {/* tabs */}
      <div className="flex flex-row py-8 border-b relative">
        {tabs.map((tab, index) => (
          <div
            key={index}
            ref={(el) => (tabsRef.current[index] = el)}
            className={`px-4 flex flex-row items-center gap-2 cursor-pointer ${
              activeTab === tab.number ? "text-blue-500" : ""
            }`}
            onClick={() => handleTabChange(tab)}
          >
            {tab.icon}
            <P1>{tab.label}</P1>
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
      {/* content */}
      {tabs.find((tab) => tab.number === activeTab)?.content && (
        <div className="py-6">
          {tabs.find((tab) => tab.number === activeTab)?.content}
        </div>
      )}
    </div>
  );
};

export default TabPanel;

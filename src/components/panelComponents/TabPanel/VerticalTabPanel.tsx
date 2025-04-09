import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { MdOutlineMenu } from "react-icons/md";
import { useGeneralContext } from "../../../context/General.context";
import "../../../index.css";
import { P1 } from "../Typography";
import { Tab } from "../shared/types";

type Props = {
  tabs: Tab[];
  activeTab: number;
  setActiveTab: (tab: number) => void;
  additionalClickAction?: () => void;
  additionalOpenAction?: () => void;
  sideClassName?: string; // Optional extra class for the sidebar container
  filters?: React.ReactNode[];
  isLanguageChange?: boolean;
};

const VerticalTabPanelResponsive: React.FC<Props> = ({
  additionalClickAction,
  tabs,
  activeTab,
  setActiveTab,
  additionalOpenAction,
  sideClassName,
  filters,
  isLanguageChange = true,
}) => {
  const { t } = useTranslation();
  const { resetGeneralContext } = useGeneralContext();
  const adjustedTabs = tabs
    .filter((tab) => !tab.isDisabled)
    .map((tab, index) => ({
      ...tab,
      adjustedNumber: index,
    }));
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleTabChange = (tab: Tab) => {
    additionalClickAction && additionalClickAction();
    resetGeneralContext();
    if (isMenuOpen) {
      setIsMenuOpen(false);
    }
    const currentTab = adjustedTabs.find((t) => t.adjustedNumber === activeTab);
    currentTab?.onCloseAction?.();
    setActiveTab(tab.adjustedNumber ?? tab.number);
    tab.onOpenAction?.();
  };

  return (
    <div className="flex flex-col border rounded-lg border-gray-200 bg-white w-full mx-auto">
      {/* Small Screen Top Bar */}
      <div className="md:hidden flex items-center p-4 border-b sticky top-16 ">
        <button onClick={() => setIsMenuOpen(true)}>
          <MdOutlineMenu size={24} />
        </button>
        <div className="ml-4">
          <P1 className="text-blue-500">
            {t(
              adjustedTabs.find((tab) => tab.adjustedNumber === activeTab)
                ?.label || ""
            )}
          </P1>
        </div>
      </div>

      <div className="flex flex-1 ">
        <div
          className={`hidden md:flex flex-col pt-10 ${
            sideClassName ? sideClassName : "w-40"
          } border-r h-fit sticky top-16`}
        >
          {adjustedTabs.map((tab, index) => (
            <div
              key={index}
              onClick={() => handleTabChange(tab)}
              className={`px-4 py-3 flex flex-row items-center gap-2 cursor-pointer ${
                activeTab === tab.adjustedNumber ? "text-blue-500" : ""
              }`}
            >
              {tab.icon}
              <P1 className="inline ml-2">{t(tab.label)}</P1>
            </div>
          ))}
          {filters && filters.length > 0 && (
            <div className="p-4">
              {filters.map((filter, idx) => (
                <div key={idx}>{filter}</div>
              ))}
            </div>
          )}
        </div>
        <div className="flex-1 p-4">
          {
            adjustedTabs.find((tab) => tab.adjustedNumber === activeTab)
              ?.content
          }
        </div>
      </div>
      {isMenuOpen && (
        <div className="fixed inset-0 bg-white z-50 overflow-y-auto">
          <div className="p-4 border-b flex items-center">
            <button onClick={() => setIsMenuOpen(false)}>
              {/* Reusing the menu icon as a close button; you can swap it for a dedicated close icon if preferred */}
              <MdOutlineMenu size={24} />
            </button>
            <div className="ml-4">
              <P1 className="font-bold">
                {t(
                  adjustedTabs.find((tab) => tab.adjustedNumber === activeTab)
                    ?.label ?? ""
                )}
              </P1>
            </div>
          </div>
          <div className="flex flex-col">
            {adjustedTabs.map((tab, index) => (
              <div
                key={index}
                onClick={() => handleTabChange(tab)}
                className={`px-4 py-3 flex flex-row items-center gap-2 cursor-pointer ${
                  activeTab === tab.adjustedNumber ? "text-blue-500" : ""
                }`}
              >
                {tab.icon}
                <P1 className="inline ml-2">{t(tab.label)}</P1>
              </div>
            ))}
            {filters && filters.length > 0 && (
              <div className="p-4">
                {filters.map((filter, idx) => (
                  <div key={idx}>{filter}</div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default VerticalTabPanelResponsive;

import { FaArchive } from "react-icons/fa";
import { GoChecklist } from "react-icons/go";
import CheckArchive from "../components/checklist/CheckArchive";
import ChecklistsTab from "../components/checklist/Checklists";
import { Header } from "../components/header/Header";
import UnifiedTabPanel from "../components/panelComponents/TabPanel/UnifiedTabPanel";
import { useGeneralContext } from "../context/General.context";
import { useUserContext } from "../context/User.context";
import { CheclistPageTabEnum } from "../types";
import { useGetPanelControlPages } from "../utils/api/panelControl/page";

export const ChecklistTabs = [
  {
    number: CheclistPageTabEnum.CHECKARCHIVE,
    label: "Check Archive",
    icon: <FaArchive className="text-lg font-thin" />,
    content: <CheckArchive />,
    isDisabled: false,
  },
  {
    number: CheclistPageTabEnum.CHECKLISTS,
    label: "Checklists",
    icon: <GoChecklist className="text-lg font-thin" />,
    content: <ChecklistsTab />,
    isDisabled: false,
  },
];
export default function Checklists() {
  const { checklistActiveTab, setChecklistActiveTab } = useGeneralContext();
  const currentPageId = "checklists";
  const pages = useGetPanelControlPages();
  const { user } = useUserContext();
  if (!user || pages.length === 0) return <></>;
  const currentPageTabs = pages.find(
    (page) => page._id === currentPageId
  )?.tabs;
  const tabs = ChecklistTabs.map((tab) => {
    return {
      ...tab,
      isDisabled: currentPageTabs
        ?.find((item) => item.name === tab.label)
        ?.permissionRoles?.includes(user.role._id)
        ? false
        : true,
    };
  });
  return (
    <>
      <Header showLocationSelector={false} />
      <UnifiedTabPanel
        tabs={tabs}
        activeTab={checklistActiveTab}
        setActiveTab={setChecklistActiveTab}
        allowOrientationToggle={true}
      />
    </>
  );
}

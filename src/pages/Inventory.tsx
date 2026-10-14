import { BsClockHistory } from "react-icons/bs";
import { TbPackages } from "react-icons/tb";
import { Header } from "../components/header/Header";
import InventoryBoxes from "../components/inventory/InventoryBoxes";
import InventoryMovements from "../components/inventory/InventoryMovements";
import UnifiedTabPanel from "../components/panelComponents/TabPanel/UnifiedTabPanel";
import { useGeneralContext } from "../context/General.context";
import { useUserContext } from "../context/User.context";
import { InventoryPageTabEnum } from "../types";
import { useGetPanelControlPages } from "../utils/api/panelControl/page";

export const InventoryPageTabs = [
  {
    number: InventoryPageTabEnum.INVENTORY,
    label: "Inventory",
    icon: <TbPackages className="text-lg font-thin" />,
    content: <InventoryBoxes />,
    isDisabled: false,
  },
  {
    number: InventoryPageTabEnum.HISTORY,
    label: "Inventory History",
    icon: <BsClockHistory className="text-lg font-thin" />,
    content: <InventoryMovements />,
    isDisabled: false,
  },
];
export default function Inventory() {
  const {
    setCurrentPage,
    setSearchQuery,
    inventoryActiveTab,
    setInventoryActiveTab,
  } = useGeneralContext();
  const currentPageId = "inventory";
  const pages = useGetPanelControlPages();
  const { user } = useUserContext();
  if (!user || (pages && pages?.length === 0)) return <></>;
  const currentPageTabs = pages.find(
    (page) => page._id === currentPageId
  )?.tabs;
  const tabs = InventoryPageTabs.map((tab) => {
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
      <div className="flex flex-col gap-2 mt-5 ">
        <UnifiedTabPanel
          tabs={tabs}
          activeTab={inventoryActiveTab}
          setActiveTab={setInventoryActiveTab}
          additionalOpenAction={() => {
            setCurrentPage(1);
            setSearchQuery("");
          }}
          allowOrientationToggle={true}
        />
      </div>
    </>
  );
}

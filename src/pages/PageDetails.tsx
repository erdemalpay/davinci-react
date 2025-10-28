import { useState } from "react";
import { MdManageAccounts } from "react-icons/md";
import { Header } from "../components/header/Header";
import UnifiedTabPanel from "../components/panelComponents/TabPanel/UnifiedTabPanel";
import PageTabPermissions from "../components/panelControl/PageTabPermissions";
import { useGeneralContext } from "../context/General.context";
import { PageDetailsPageTabEnum } from "../types";

const PageDetails = () => {
  const { resetGeneralContext } = useGeneralContext();
  const [activeTab, setActiveTab] = useState(0);
  const tabs = [
    {
      number: PageDetailsPageTabEnum.PAGETABPERMISSIONS,
      label: "Page Tab Permissions",
      icon: <MdManageAccounts className="text-lg font-thin" />,
      content: <PageTabPermissions />,
      isDisabled: false,
    },
  ];
  return (
    <>
      <Header showLocationSelector={false} />
      <UnifiedTabPanel
        tabs={tabs}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        additionalOpenAction={() => {
          resetGeneralContext();
        }}
        allowOrientationToggle={true}
      />
    </>
  );
};

export default PageDetails;

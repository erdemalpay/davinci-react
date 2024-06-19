import { useState } from "react";
import { MdManageAccounts } from "react-icons/md";
import { Header } from "../components/header/Header";
import TabPanel from "../components/panelComponents/TabPanel/TabPanel";
import PageTabPermissions from "../components/panelControl/PageTabPermissions";
import { useGeneralContext } from "../context/General.context";
import { PageDetailsPageTabEnum } from "../types";

const PageDetails = () => {
  const { setCurrentPage, setExpandedRows, setSearchQuery } =
    useGeneralContext();
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
      <TabPanel
        tabs={tabs}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        additionalOpenAction={() => {
          setCurrentPage(1);
          setExpandedRows({});
          setSearchQuery("");
        }}
      />
    </>
  );
};

export default PageDetails;

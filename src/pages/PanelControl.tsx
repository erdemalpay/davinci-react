import { FaCashRegister } from "react-icons/fa6";
import { MdManageAccounts } from "react-icons/md";
import { Header } from "../components/header/Header";
import TabPanel from "../components/panelComponents/TabPanel/TabPanel";
import CheckoutCash from "../components/panelControl/CheckoutCash";
import PagePermissions from "../components/panelControl/PagePermissions";
import { useGeneralContext } from "../context/General.context";
import { PanelControlPageTabEnum } from "../types";
const PanelControl = () => {
  const {
    setCurrentPage,
    setExpandedRows,
    setSearchQuery,
    panelControlActiveTab,
    setPanelControlActiveTab,
  } = useGeneralContext();
  const tabs = [
    {
      number: PanelControlPageTabEnum.PAGEPERMISSIONS,
      label: "Page Permissions",
      icon: <MdManageAccounts className="text-lg font-thin" />,
      content: <PagePermissions />,
      isDisabled: false,
    },
    {
      number: PanelControlPageTabEnum.CHECKOUTCASH,
      label: "Checkout Cash",
      icon: <FaCashRegister className="text-lg font-thin" />,
      content: <CheckoutCash />,
      isDisabled: false,
    },
  ];

  return (
    <>
      <Header showLocationSelector={false} />
      <TabPanel
        tabs={tabs}
        activeTab={panelControlActiveTab}
        setActiveTab={setPanelControlActiveTab}
        additionalOpenAction={() => {
          setCurrentPage(1);
          setExpandedRows({});
          setSearchQuery("");
        }}
      />
    </>
  );
};

export default PanelControl;

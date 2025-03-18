import { FaCashRegister } from "react-icons/fa6";
import { IoIosSettings } from "react-icons/io";
import { MdManageAccounts } from "react-icons/md";
import { SiGnuprivacyguard } from "react-icons/si";
import { Header } from "../components/header/Header";
import TabPanel from "../components/panelComponents/TabPanel/TabPanel";
import CheckoutCash from "../components/panelControl/CheckoutCash";
import PagePermissions from "../components/panelControl/PagePermissions";
import PanelSettings from "../components/panelControl/PanelSettings";
import RouteAuthorizationPermissions from "../components/panelControl/RouteAuthorizationPermissions";
import { useGeneralContext } from "../context/General.context";
import { PanelControlPageTabEnum } from "../types";

const PanelControl = () => {
  const {
    resetGeneralContext,
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
      number: PanelControlPageTabEnum.ROUTEAUTHORIZATIONPERMISSIONS,
      label: "Route Authorization Permissions",
      icon: <SiGnuprivacyguard className="text-lg font-thin" />,
      content: <RouteAuthorizationPermissions />,
      isDisabled: false,
    },
    {
      number: PanelControlPageTabEnum.CHECKOUTCASH,
      label: "Checkout Cash",
      icon: <FaCashRegister className="text-lg font-thin" />,
      content: <CheckoutCash />,
      isDisabled: false,
    },
    {
      number: PanelControlPageTabEnum.PANELSETTINGS,
      label: "Panel Settings",
      icon: <IoIosSettings className="text-lg font-thin" />,
      content: <PanelSettings />,
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
          resetGeneralContext;
        }}
      />
    </>
  );
};

export default PanelControl;

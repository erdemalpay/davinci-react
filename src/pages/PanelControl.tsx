import { FaTasks } from "react-icons/fa";
import { GrConfigure } from "react-icons/gr";
import { IoIosSettings } from "react-icons/io";
import { MdManageAccounts, MdOutlineNewReleases, MdSchool } from "react-icons/md";
import { SiGnuprivacyguard } from "react-icons/si";
import { Header } from "../components/header/Header";
import UnifiedTabPanel from "../components/panelComponents/TabPanel/UnifiedTabPanel";
import DisabledConditions from "../components/panelControl/DisabledConditions";
import EducationPermissions from "../components/panelControl/EducationPermissions";
import PagePermissions from "../components/panelControl/PagePermissions";
import PanelSettings from "../components/panelControl/PanelSettings";
import ReleaseNotesTab from "../components/panelControl/ReleaseNotesTab";
import RouteAuthorizationPermissions from "../components/panelControl/RouteAuthorizationPermissions";
import TaskTrackPage from "../components/panelControl/TaskTrack";
import { useTranslation } from "react-i18next";
import { useGeneralContext } from "../context/General.context";
import { PanelControlPageTabEnum } from "../types";

const PanelControl = () => {
  const { t } = useTranslation();
  const {
    resetGeneralContext,
    panelControlActiveTab,
    setPanelControlActiveTab,
  } = useGeneralContext();
  const tabs = [
    {
      number: PanelControlPageTabEnum.TASKTRACK,
      label: "Task Track",
      icon: <FaTasks className="text-lg font-thin" />,
      content: <TaskTrackPage />,
      isDisabled: false,
    },
    {
      number: PanelControlPageTabEnum.RELEASENOTES,
      label: t("ReleaseNotesTitleTab"),
      icon: <MdOutlineNewReleases className="text-lg font-thin" />,
      content: <ReleaseNotesTab />,
      isDisabled: false,
    },
    {
      number: PanelControlPageTabEnum.PAGEPERMISSIONS,
      label: "Page Permissions",
      icon: <MdManageAccounts className="text-lg font-thin" />,
      content: <PagePermissions />,
      isDisabled: false,
    },
    {
      number: PanelControlPageTabEnum.DISABLEDCONDITIONS,
      label: "Disabled Conditions",
      icon: <GrConfigure className="text-lg font-thin" />,
      content: <DisabledConditions />,
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
      number: PanelControlPageTabEnum.EDUCATIONPERMISSIONS,
      label: "Education Permissions",
      icon: <MdSchool className="text-lg font-thin" />,
      content: <EducationPermissions />,
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
      <UnifiedTabPanel
        tabs={tabs}
        activeTab={panelControlActiveTab}
        setActiveTab={setPanelControlActiveTab}
        additionalOpenAction={() => {
          resetGeneralContext;
        }}
        allowOrientationToggle={true}
      />
    </>
  );
};

export default PanelControl;

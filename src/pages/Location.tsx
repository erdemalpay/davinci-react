import { useState } from "react";
import { useTranslation } from "react-i18next";
import { FaPhoenixFramework } from "react-icons/fa";
import { MdOutlineTableRestaurant } from "react-icons/md";
import { useNavigate, useParams } from "react-router-dom";
import CommonSelectInput from "../components/common/SelectInput";
import { Header } from "../components/header/Header";
import Shifts from "../components/location/Shifts";
import TableNames from "../components/location/TableNames";
import PageNavigator from "../components/panelComponents/PageNavigator/PageNavigator";
import UnifiedTabPanel from "../components/panelComponents/TabPanel/UnifiedTabPanel";
import { useGeneralContext } from "../context/General.context";
import { useUserContext } from "../context/User.context";
import { Routes } from "../navigation/constants";
import { Location, LocationPageTabEnum } from "../types";
import { useGetStoreLocations } from "../utils/api/location";
import { useGetPanelControlPages } from "../utils/api/panelControl/page";

export const LocationPageTabs = [
  {
    number: LocationPageTabEnum.TABLENAMES,
    label: "Tables",
    icon: <MdOutlineTableRestaurant className="text-lg font-thin" />,
    isDisabled: false,
  },
  {
    number: LocationPageTabEnum.SHIFTS,
    label: "Shifts",
    icon: <FaPhoenixFramework className="text-lg font-thin" />,
    isDisabled: false,
  },
];
export default function LocationPage() {
  const navigate = useNavigate();
  const { resetGeneralContext } = useGeneralContext();
  const [activeTab, setActiveTab] = useState<number>(0);
  const [tabPanelKey, setTabPanelKey] = useState(0);
  const [selectedLocation, setSelectedLocation] = useState<Location>();
  const { locationId } = useParams();
  const locations = useGetStoreLocations();
  const currentLocation = locations?.find(
    (location) => location._id.toString() === locationId
  );
  const { t } = useTranslation();
  const pageNavigations = [
    {
      name: t("Constants"),
      path: Routes.Accounting,
      canBeClicked: true,
      additionalSubmitFunction: () => {
        resetGeneralContext();
      },
    },
    {
      name: t("Locations"),
      path: "",
      canBeClicked: false,
    },
  ];
  const locationOptions = locations?.map((l) => {
    return {
      value: l._id.toString(),
      label: l.name,
    };
  });
  const pages = useGetPanelControlPages();
  const { user } = useUserContext();
  const currentPageId = "location";
  const currentPageTabs = pages?.find(
    (page) => page._id === currentPageId
  )?.tabs;
  const tabs = LocationPageTabs.map((tab) => {
    if (tab.number === LocationPageTabEnum.TABLENAMES) {
      return {
        ...tab,
        content: <TableNames locationId={Number(locationId)} />,
        isDisabled:
          user?.role?._id &&
          currentPageTabs
            ?.find((item) => item.name === tab.label)
            ?.permissionRoles?.includes(user.role._id)
            ? false
            : true,
      };
    } else if (tab.number === LocationPageTabEnum.SHIFTS) {
      return {
        ...tab,
        content: <Shifts locationId={Number(locationId)} />,
        isDisabled:
          user?.role?._id &&
          currentPageTabs
            ?.find((item) => item.name === tab.label)
            ?.permissionRoles?.includes(user.role._id)
            ? false
            : true,
      };
    } else {
      return {
        ...tab,
        isDisabled:
          user?.role?._id &&
          currentPageTabs
            ?.find((item) => item.name === tab.label)
            ?.permissionRoles?.includes(user.role._id)
            ? false
            : true,
      };
    }
  });
  return (
    <>
      <Header showLocationSelector={false} />
      <PageNavigator navigations={pageNavigations} />
      <div className="flex flex-col gap-4">
        <div className="w-[95%] mx-auto">
          <div className="sm:w-1/4 ">
            <CommonSelectInput
              options={locationOptions}
              value={
                selectedLocation
                  ? {
                      value: selectedLocation._id.toString(),
                      label: selectedLocation.name,
                    }
                  : currentLocation
                  ? {
                      value: currentLocation._id.toString(),
                      label: currentLocation.name,
                    }
                  : null
              }
              onChange={(selectedOption) => {
                setSelectedLocation(
                  locations?.find(
                    (l) => l._id.toString() === selectedOption?.value
                  )
                );
                resetGeneralContext();
                setTabPanelKey((prev) => prev + 1);
                navigate(`/location/${selectedOption?.value}`);
              }}
              placeholder={t("Select a location")}
            />
          </div>
        </div>
        <UnifiedTabPanel
          key={tabPanelKey}
          tabs={tabs as any}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          additionalOpenAction={() => {
            resetGeneralContext();
          }}
          allowOrientationToggle={true}
        />
      </div>
    </>
  );
}

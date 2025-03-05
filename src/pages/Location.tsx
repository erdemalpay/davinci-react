import { useState } from "react";
import { useTranslation } from "react-i18next";
import { MdOutlineTableRestaurant } from "react-icons/md";
import { useNavigate, useParams } from "react-router-dom";
import Loading from "../components/common/Loading";
import CommonSelectInput from "../components/common/SelectInput";
import { Header } from "../components/header/Header";
import TableNames from "../components/location/TableNames";
import PageNavigator from "../components/panelComponents/PageNavigator/PageNavigator";
import TabPanel from "../components/panelComponents/TabPanel/TabPanel";
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
];
export default function LocationPage() {
  const navigate = useNavigate();
  const { resetGeneralContext } = useGeneralContext();
  const [activeTab, setActiveTab] = useState<number>(0);
  const [tabPanelKey, setTabPanelKey] = useState(0);
  const [selectedLocation, setSelectedLocation] = useState<Location>();
  const { locationId } = useParams();
  if (!locationId) return <Loading />;
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
      name: t("Location"),
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
  if (!locations || !pages || !user || !currentLocation) {
    return <Loading />;
  }
  const currentPageId = "location";
  const currentPageTabs = pages.find(
    (page) => page._id === currentPageId
  )?.tabs;
  const tabs = LocationPageTabs.map((tab) => {
    if (tab.number === LocationPageTabEnum.TABLENAMES) {
      return {
        ...tab,
        content: <TableNames locationId={Number(locationId)} />,
        isDisabled: currentPageTabs
          ?.find((item) => item.name === tab.label)
          ?.permissionRoles?.includes(user.role._id)
          ? false
          : true,
      };
    } else {
      return {
        ...tab,
        isDisabled: currentPageTabs
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
                  : {
                      value: currentLocation._id.toString(),
                      label: currentLocation.name,
                    }
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
        <TabPanel
          key={tabPanelKey}
          tabs={tabs as any}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          additionalOpenAction={() => {
            resetGeneralContext();
          }}
        />
      </div>
    </>
  );
}

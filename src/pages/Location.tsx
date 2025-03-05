import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router-dom";
import Loading from "../components/common/Loading";
import CommonSelectInput from "../components/common/SelectInput";
import { Header } from "../components/header/Header";
import PageNavigator from "../components/panelComponents/PageNavigator/PageNavigator";
import { useGeneralContext } from "../context/General.context";
import { useUserContext } from "../context/User.context";
import { Routes } from "../navigation/constants";
import { Location } from "../types";
import { useGetStoreLocations } from "../utils/api/location";
import { useGetPanelControlPages } from "../utils/api/panelControl/page";

export default function LocationPage() {
  const navigate = useNavigate();
  const { resetGeneralContext } =
    useGeneralContext();
  const [selectedLocation, setSelectedLocation] = useState<Location>();
  const { locationId } = useParams();
  if(!locationId) return <Loading/>
  const locations = useGetStoreLocations();
  const currentLocation = locations?.find((location) => location._id.toString() === locationId);
  const { t } = useTranslation();
  const pageNavigations = [
    {
      name: t("Constants"),
      path: Routes.Accounting,
      canBeClicked: true,
      additionalSubmitFunction: () => {
        resetGeneralContext()
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
                  locations?.find((l) => l._id.toString() === selectedOption?.value)
                );
                resetGeneralContext()
                navigate(`/location/${selectedOption?.value}`);
              }}
              placeholder={t("Select a location")}
            />
          </div>
        </div>

      
      </div>
    </>
  );
}

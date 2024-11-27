import { useState } from "react";
import { useTranslation } from "react-i18next";
import { GiTakeMyMoney } from "react-icons/gi";
import { useNavigate, useParams } from "react-router-dom";
import CommonSelectInput from "../components/common/SelectInput";
import { Header } from "../components/header/Header";
import PageNavigator from "../components/panelComponents/PageNavigator/PageNavigator";
import TabPanel from "../components/panelComponents/TabPanel/TabPanel";
import ServiceExpenses from "../components/service/ServiceExpenses";
import { useGeneralContext } from "../context/General.context";
import { Routes } from "../navigation/constants";
import { AccountService, ServicePageTabEnum } from "../types";
import { useGetAccountServices } from "../utils/api/account/service";

export default function Service() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<number>(0);
  const { serviceId } = useParams();
  const { setCurrentPage, setRowsPerPage, setSearchQuery, setSortConfigKey } =
    useGeneralContext();
  const [tabPanelKey, setTabPanelKey] = useState(0);
  const [selectedService, setSelectedService] = useState<AccountService>();
  const services = useGetAccountServices();
  const currentService = services?.find((item) => item._id === serviceId);
  const { t } = useTranslation();
  const serviceOption = services?.map((p) => {
    return {
      value: p._id,
      label: p.name,
    };
  });
  const pageNavigations = [
    {
      name: t("Constants"),
      path: Routes.Accounting,
      canBeClicked: true,
      additionalSubmitFunction: () => {
        setCurrentPage(1);
        // setRowsPerPage(RowPerPageEnum.FIRST);
        setSortConfigKey(null);
        setSearchQuery("");
      },
    },
    {
      name: t("Service"),
      path: "",
      canBeClicked: false,
    },
  ];
  if (!currentService) return <></>;
  const tabs = [
    {
      number: ServicePageTabEnum.SERVICEEXPENSES,
      label: "Service Expenses",
      icon: <GiTakeMyMoney className="text-lg font-thin" />,
      content: <ServiceExpenses selectedService={currentService} />,
      isDisabled: false,
    },
  ];

  return (
    <>
      <Header showLocationSelector={false} />
      <PageNavigator navigations={pageNavigations} />
      <div className="flex flex-col gap-4">
        <div className="w-[95%] mx-auto">
          <div className="sm:w-1/4 ">
            <CommonSelectInput
              options={serviceOption}
              value={
                selectedService
                  ? {
                      value: selectedService._id,
                      label: selectedService.name,
                    }
                  : {
                      value: currentService._id,
                      label: currentService.name,
                    }
              }
              onChange={(selectedOption) => {
                setSelectedService(
                  services?.find((p) => p._id === selectedOption?.value)
                );
                setCurrentPage(1);
                // setRowsPerPage(RowPerPageEnum.FIRST);
                setSearchQuery("");
                setTabPanelKey(tabPanelKey + 1);
                setActiveTab(0);
                setSortConfigKey(null);
                navigate(`/service/${selectedOption?.value}`);
              }}
              placeholder={t("Select a Service")}
            />
          </div>
        </div>

        <TabPanel
          key={tabPanelKey}
          tabs={tabs}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          additionalOpenAction={() => {
            setCurrentPage(1);
            setSearchQuery("");
          }}
        />
      </div>
    </>
  );
}

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { GiTakeMyMoney } from "react-icons/gi";
import { useNavigate, useParams } from "react-router-dom";
import SelectInput from "../components/common/SelectInput";
import { Header } from "../components/header/Header";
import TabPanel from "../components/panelComponents/TabPanel/TabPanel";
import ServiceExpenses from "../components/service/ServiceExpenses";
import { useGeneralContext } from "../context/General.context";
import { AccountService, ServicePageTabEnum } from "../types";
import { useGetAccountServices } from "../utils/api/account/service";
import i18n from "../utils/i18n";

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

  if (!currentService) return <></>;
  const tabs = [
    {
      number: ServicePageTabEnum.SERVICEEXPENSES,
      label: t("Service Expenses"),
      icon: <GiTakeMyMoney className="text-lg font-thin" />,
      content: <ServiceExpenses selectedService={currentService} />,
      isDisabled: false,
    },
  ];
  const filteredTabs = tabs
    ?.filter((tab) => !tab.isDisabled)
    .map((tab, index) => {
      return {
        ...tab,
        number: index,
      };
    });
  return (
    <>
      <Header showLocationSelector={false} />
      <div className="flex flex-col gap-4">
        <div className="w-[95%] mx-auto">
          <div className="sm:w-1/4 ">
            <SelectInput
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
          key={tabPanelKey + i18n.language}
          tabs={filteredTabs}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
        />
      </div>
    </>
  );
}

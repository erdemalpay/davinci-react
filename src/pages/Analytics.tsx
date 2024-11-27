import { useState } from "react";
import { useTranslation } from "react-i18next";
import AccountingAnalytics from "../components/analytics/AccountingAnalytics";
import GameplayAnalytics from "../components/analytics/GameplayAnalytics";
import CommonSelectInput from "../components/common/SelectInput";
import { Header } from "../components/header/Header";
import { useUserContext } from "../context/User.context";
import { Role, RoleEnum } from "../types";

type AnalyticOption = {
  id: string;
  label: string;
  component: JSX.Element;
  isDisabled: boolean;
};
export default function Analytics() {
  const { user } = useUserContext();
  const { t } = useTranslation();
  const analyticOptions: AnalyticOption[] = [
    {
      id: "0",
      label: "Gameplay",
      component: <GameplayAnalytics />,
      isDisabled: user
        ? (user.role as Role)._id === RoleEnum.CATERINGMANAGER
        : false,
    },
    {
      id: "1",
      label: "Accounting",
      component: <AccountingAnalytics />,
      isDisabled: user
        ? ![RoleEnum.MANAGER, RoleEnum.CATERINGMANAGER].includes(
            (user.role as Role)._id
          )
        : true,
    },
  ];
  const [selectedOption, setSelectedOption] = useState(
    analyticOptions.find(
      (option) => option.isDisabled === false
    ) as AnalyticOption
  );

  return (
    <>
      <Header showLocationSelector={false} />
      {analyticOptions &&
        analyticOptions.filter((option) => option.isDisabled === false).length >
          1 && (
          <div className="w-[95%] mx-auto">
            <div className="sm:w-1/5 ">
              <CommonSelectInput
                options={analyticOptions
                  .filter((option) => option.isDisabled === false)
                  .map((option) => {
                    return {
                      value: option.id,
                      label: option.label,
                    };
                  })}
                value={
                  selectedOption
                    ? {
                        value: selectedOption.id,
                        label: selectedOption.label,
                      }
                    : null
                }
                onChange={(selectedOption) => {
                  setSelectedOption(
                    analyticOptions.find(
                      (option) => option.id === selectedOption?.value
                    ) as AnalyticOption
                  );
                }}
                placeholder={t("Select an analytic type")}
              />
            </div>
          </div>
        )}
      {selectedOption && selectedOption.component}
    </>
  );
}

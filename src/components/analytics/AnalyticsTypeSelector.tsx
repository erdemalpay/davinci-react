import { useTranslation } from "react-i18next";
import { useLocation, useNavigate } from "react-router-dom";
import { useUserContext } from "../../context/User.context";
import { Routes } from "../../navigation/constants";
import { Role, RoleEnum } from "../../types";
import CommonSelectInput from "../common/SelectInput";

export default function AnalyticsTypeSelector() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useUserContext();
  const analyticOptions = [
    {
      value: Routes.GameplayAnalytics as string,
      label: t("Gameplay Analytics"),
      isDisabled: user
        ? (user.role as Role)._id === RoleEnum.OPERATIONSASISTANT
        : false,
    },
    {
      value: Routes.AccountingAnalytics as string,
      label: t("Accounting Analytics"),
      isDisabled: user
        ? ![RoleEnum.MANAGER].includes((user.role as Role)._id)
        : true,
    },
  ].filter((option) => !option.isDisabled);
  if (analyticOptions.length <= 1) {
    return <></>;
  }
  const selectedOption =
    analyticOptions.find((option) => option.value === location.pathname) ??
    null;
  return (
    <div className="w-[98%] mx-auto mt-4">
      <div className="sm:w-1/5 ">
        <CommonSelectInput
          options={analyticOptions.map((option) => ({
            value: option.value,
            label: option.label,
          }))}
          value={
            selectedOption
              ? { value: selectedOption.value, label: selectedOption.label }
              : null
          }
          onChange={(selectedOption) => {
            if (
              selectedOption?.value &&
              selectedOption.value !== location.pathname
            ) {
              navigate(selectedOption.value);
            }
          }}
          placeholder={t("Select an analytic type")}
        />
      </div>
    </div>
  );
}

import { useTranslation } from "react-i18next";
import CommonSelectInput from "../components/common/SelectInput";
import { Header } from "../components/header/Header";
import { countListOptions } from "../constants/countList";
import { useGeneralContext } from "../context/General.context";
export default function CountLists() {
  const { t } = useTranslation();

  const { countListOption, setCountListOption } = useGeneralContext();

  return (
    <>
      <Header showLocationSelector={false} />
      {countListOptions &&
        countListOptions.filter((option) => option.isDisabled === false)
          .length > 1 && (
          <div className="w-[95%] mx-auto">
            <div className="sm:w-1/5 ">
              <CommonSelectInput
                options={countListOptions
                  .filter((option) => option.isDisabled === false)
                  .map((option) => {
                    return {
                      value: option.id,
                      label: t(option.label),
                    };
                  })}
                value={
                  countListOption
                    ? {
                        value: countListOption.id,
                        label: t(countListOption.label),
                      }
                    : null
                }
                onChange={(countListOption) => {
                  setCountListOption(
                    countListOptions.find(
                      (option) => option.id === countListOption?.value
                    ) as any
                  );
                }}
                placeholder={t("Select a count list  type")}
              />
            </div>
          </div>
        )}
      {countListOption && countListOption.component}
    </>
  );
}

import { useTranslation } from "react-i18next";
import CommonSelectInput from "../components/common/SelectInput";
import CountListMenu from "../components/countLists/CountListMenu";
import { Header } from "../components/header/Header";
import { useGeneralContext } from "../context/General.context";

export type CountListOptions = {
  id: string;
  label: string;
  component: JSX.Element;
  isDisabled: boolean;
};
export const countListOptions: CountListOptions[] = [
  {
    id: "0",
    label: "Product Count List",
    component: <CountListMenu />,
    isDisabled: false,
  },
];
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
                    ) as CountListOptions
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

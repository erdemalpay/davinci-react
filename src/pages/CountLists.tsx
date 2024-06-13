import { useState } from "react";
import { useTranslation } from "react-i18next";
import SelectInput from "../components/common/SelectInput";
import FixtureCountListMenu from "../components/countLists/fixtureCountList/FixtureCountListMenu";
import CountListMenu from "../components/countLists/productCountList/CountListMenu";
import { Header } from "../components/header/Header";

type CountListOptions = {
  id: string;
  label: string;
  component: JSX.Element;
  isDisabled: boolean;
};
export default function CountLists() {
  const { t } = useTranslation();
  const countListOptions: CountListOptions[] = [
    {
      id: "0",
      label: "Product Count List",
      component: <CountListMenu />,
      isDisabled: false,
    },
    {
      id: "1",
      label: "Fixture Count List",
      component: <FixtureCountListMenu />,
      isDisabled: false,
    },
  ];
  const [selectedOption, setSelectedOption] = useState(
    countListOptions.find(
      (option) => option.isDisabled === false
    ) as CountListOptions
  );

  return (
    <>
      <Header showLocationSelector={false} />
      {countListOptions &&
        countListOptions.filter((option) => option.isDisabled === false)
          .length > 1 && (
          <div className="w-[95%] mx-auto">
            <div className="sm:w-1/5 ">
              <SelectInput
                options={countListOptions
                  .filter((option) => option.isDisabled === false)
                  .map((option) => {
                    return {
                      value: option.id,
                      label: t(option.label),
                    };
                  })}
                value={
                  selectedOption
                    ? {
                        value: selectedOption.id,
                        label: t(selectedOption.label),
                      }
                    : null
                }
                onChange={(selectedOption) => {
                  setSelectedOption(
                    countListOptions.find(
                      (option) => option.id === selectedOption?.value
                    ) as CountListOptions
                  );
                }}
                placeholder={t("Select a count list  type")}
              />
            </div>
          </div>
        )}
      {selectedOption && selectedOption.component}
    </>
  );
}

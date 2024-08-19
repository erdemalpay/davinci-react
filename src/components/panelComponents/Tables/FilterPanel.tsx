import { useTranslation } from "react-i18next";
import { IoIosClose } from "react-icons/io";
import { ActionMeta, MultiValue, SingleValue } from "react-select";
import { useGeneralContext } from "../../../context/General.context";
import SelectInput from "../FormElements/SelectInput";
import TextInput from "../FormElements/TextInput";
import { InputTypes, PanelFilterType } from "../shared/types";
import { H4, H6 } from "../Typography";

type OptionType = { value: string; label: string };

const FilterPanel = <T,>({
  inputs,
  formElements,
  setFormElements,
  closeFilters,
}: PanelFilterType<T>) => {
  const { t } = useTranslation();
  const { setCurrentPage } = useGeneralContext();
  return (
    <div className="flex flex-col gap-3 __className_a182b8 bg-white min-w-full sm:min-w-[20rem] border h-fit pb-8 border-gray-200 rounded-md py-2 px-3 focus:outline-none ">
      <div className="flex flex-row justify-between">
        <H4 className="my-1">{t("Filters")}</H4>
        <button onClick={closeFilters}>
          <IoIosClose className="w-8 h-8 mx-auto p-1 cursor-pointer  hover:bg-gray-50 hover:rounded-full" />
        </button>
      </div>
      {inputs.map((input) => {
        const value = formElements[input.formKey];
        const handleChange = (key: string) => (value: string) => {
          const changedInput = inputs.find((input) => input.formKey === key);
          if (changedInput?.invalidateKeys) {
            changedInput.invalidateKeys.forEach((key) => {
              setFormElements((prev) => ({
                ...prev,
                [key.key]: key.defaultValue,
              }));
            });
          }
          setFormElements((prev) => ({ ...prev, [key]: value }));
          setCurrentPage(1);
        };

        const handleChangeForSelect =
          (key: string) =>
          (
            selectedValue: SingleValue<OptionType> | MultiValue<OptionType>,
            actionMeta: ActionMeta<OptionType>
          ) => {
            if (
              actionMeta.action === "select-option" ||
              actionMeta.action === "remove-value" ||
              actionMeta.action === "clear"
            ) {
              if (Array.isArray(selectedValue)) {
                const values = selectedValue.map((option) => option.value);
                setFormElements((prev) => ({ ...prev, [key]: values }));
              } else if (selectedValue) {
                setFormElements((prev) => ({
                  ...prev,
                  [key]: (selectedValue as OptionType)?.value,
                }));
              } else {
                setFormElements((prev) => ({ ...prev, [key]: "" }));
              }
            }
            const changedInput = inputs.find((input) => input.formKey === key);
            if (changedInput?.invalidateKeys) {
              changedInput.invalidateKeys.forEach((key) => {
                setFormElements((prev) => ({
                  ...prev,
                  [key.key]: key.defaultValue,
                }));
              });
            }
            setCurrentPage(1);
          };
        if (input.isDisabled) return null;
        return (
          <div key={input.formKey} className="flex flex-col gap-2">
            {(input.type === InputTypes.TEXT ||
              input.type === InputTypes.NUMBER ||
              input.type === InputTypes.DATE ||
              input.type === InputTypes.TIME ||
              input.type === InputTypes.COLOR ||
              input.type === InputTypes.PASSWORD) && (
              <TextInput
                key={input.formKey}
                type={input.type}
                value={value}
                label={input.label ?? ""}
                placeholder={input.placeholder ?? ""}
                onChange={handleChange(input.formKey)}
                isDatePicker={input.isDatePicker ?? false}
                onClear={() =>
                  setFormElements((prev) => ({ ...prev, [input.formKey]: "" }))
                }
              />
            )}

            {input.type === InputTypes.SELECT && !input.isDisabled && (
              <SelectInput
                key={
                  input.isMultiple
                    ? input.formKey
                    : input.formKey + formElements[input.formKey]
                }
                value={
                  input.isMultiple
                    ? input.options?.filter((option) =>
                        formElements[input.formKey]?.includes(option.value)
                      )
                    : input.options?.find(
                        (option) => option.value === formElements[input.formKey]
                      )
                }
                label={input.label ?? ""}
                options={input.options ?? []}
                placeholder={input.placeholder ?? ""}
                isMultiple={input.isMultiple ?? false}
                onChange={handleChangeForSelect(input.formKey)}
                onClear={() => {
                  setFormElements((prev) => ({
                    ...prev,
                    [input.formKey]: input.isMultiple ? [] : "",
                  }));
                }}
              />
            )}
            {input.type === InputTypes.TEXTAREA && (
              <div className="flex flex-col gap-2" key={input.formKey}>
                <H6>{input.label}</H6>

                <textarea
                  value={value}
                  onChange={(e) => {
                    handleChange(input.formKey)(e.target.value);
                  }}
                  placeholder={input.placeholder ?? ""}
                  className="border text-sm border-gray-300 rounded-md p-2"
                />
              </div>
            )}
          </div>
        );
      })}
      <button
        className="ml-auto mt-4 bg-blue-500 hover:bg-blue-600 text-white text-sm py-2 px-3 rounded-md cursor-pointer my-auto w-fit"
        onClick={() => {
          setFormElements((prev) => {
            const newFormElements = { ...prev };
            inputs.forEach((input) => {
              newFormElements[input.formKey] = "";
            });
            return newFormElements;
          });
        }}
      >
        {t("Clear All Filters")}
      </button>
    </div>
  );
};

export default FilterPanel;

import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { IoIosClose } from "react-icons/io";
import { ActionMeta, MultiValue, SingleValue } from "react-select";
import SelectInput from "../FormElements/SelectInput";
import TextInput from "../FormElements/TextInput";
import { FormKeyTypeEnum, InputTypes, PanelFilterType } from "../shared/types";
import { H4, H6 } from "../Typography";

type OptionType = { value: string; label: string };

type FormElementsState = {
  [key: string]: any; // this is the type of the form elements it can be string, number, boolean, etc.
};
const FilterPanel = <T,>({
  inputs,
  formKeys,
  setForm,
  closeFilters,
}: PanelFilterType<T>) => {
  const { t } = useTranslation();
  const [formElements, setFormElements] = useState(() => {
    const initialState = formKeys.reduce<FormElementsState>(
      (acc, { key, type }) => {
        let defaultValue;
        switch (type) {
          case FormKeyTypeEnum.STRING:
            defaultValue = "";
            break;
          case FormKeyTypeEnum.NUMBER:
            defaultValue = 0;
            break;
          case FormKeyTypeEnum.BOOLEAN:
            defaultValue = false;
            break;
          case FormKeyTypeEnum.DATE:
            defaultValue = new Date();
            break;
          default:
            defaultValue = null;
        }
        acc[key] = defaultValue;
        return acc;
      },
      {}
    );
    return initialState;
  });

  useEffect(() => {
    setForm && setForm(formElements as T);
  }, [formElements, inputs]);
  return (
    <div className="flex flex-col gap-3 __className_a182b8 min-w-[20rem] border h-fit pb-20 border-gray-200 rounded-md py-2 px-3 focus:outline-none ">
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
          };

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
              />
            )}

            {input.type === InputTypes.SELECT && (
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
    </div>
  );
};

export default FilterPanel;

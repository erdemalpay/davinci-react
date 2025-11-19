import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { IoIosClose } from "react-icons/io";
import { ActionMeta, MultiValue, SingleValue } from "react-select";
import { useGeneralContext } from "../../../context/General.context";
import { FormElementsState, OptionType } from "../../../types";
import { GenericButton } from "../../common/GenericButton";
import DateInput from "../FormElements/DateInput";
import HourInput from "../FormElements/HourInput";
import MonthYearInput from "../FormElements/MonthYearInput";
import SelectInput from "../FormElements/SelectInput";
import TextInput from "../FormElements/TextInput";
import { H4, H6 } from "../Typography";
import { InputTypes, PanelFilterType } from "../shared/types";

const FilterPanel = <T,>({
  inputs,
  formElements,
  setFormElements,
  closeFilters,
  isApplyButtonActive = false,
  isCloseButtonActive = true,
  isFilterPanelCoverTable = false,
  additionalFilterCleanFunction,
}: PanelFilterType) => {
  const { t } = useTranslation();
  const { setCurrentPage } = useGeneralContext();
  const [tempFormElements, setTempFormElements] =
    useState<FormElementsState>(formElements);

  // Sync tempFormElements with formElements when not in apply button mode
  useEffect(() => {
    if (!isApplyButtonActive) {
      setTempFormElements(formElements);
    }
  }, [formElements, isApplyButtonActive]);
  const applyFilters = () => {
    setFormElements(tempFormElements);
    setCurrentPage(1); // Reset to the first page after applying filters
  };
  const handleClearAllFilters = () => {
    setFormElements((prev) => {
      const newFormElements = { ...prev };
      inputs.forEach((input) => {
        newFormElements[input.formKey] = "";
      });
      return newFormElements;
    });
    additionalFilterCleanFunction?.();
  };
  const buttons = [
    {
      label: "Clear All Filters",
      onClick: handleClearAllFilters,
      isDisabled: false,
    },
    {
      label: "Apply",
      onClick: applyFilters,
      isDisabled: !isApplyButtonActive,
    },
  ];

  return (
    <div
      className={`flex flex-col gap-3 __className_a182b8 bg-white min-w-full ${
        isFilterPanelCoverTable ? "" : "sm:min-w-[20rem]"
      } border h-fit pb-8 border-gray-200 rounded-md py-2 px-3 focus:outline-none `}
    >
      <div className="flex flex-row justify-between">
        <H4 className="my-1">{t("Filters")}</H4>
        {isCloseButtonActive && (
          <GenericButton onClick={closeFilters} variant="icon">
            <IoIosClose className="w-8 h-8 mx-auto p-1 cursor-pointer  hover:bg-gray-50 hover:rounded-full" />
          </GenericButton>
        )}
      </div>
      {inputs.map((input) => {
        const value = tempFormElements[input.formKey] ?? "";
        const handleChange = (key: string) => (value: string) => {
          const changedInput = inputs.find((input) => input.formKey === key);
          if (changedInput?.invalidateKeys) {
            changedInput.invalidateKeys.forEach((key) => {
              if (isApplyButtonActive) {
                setTempFormElements((prev) => ({
                  ...prev,
                  [key.key]: key.defaultValue,
                }));
              } else {
                setFormElements((prev) => ({
                  ...prev,
                  [key.key]: key.defaultValue,
                }));
              }
            });
          }

          isApplyButtonActive
            ? setTempFormElements((prev) => ({ ...prev, [key]: value }))
            : setFormElements((prev) => ({ ...prev, [key]: value }));
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
                isApplyButtonActive
                  ? setTempFormElements((prev) => ({ ...prev, [key]: values }))
                  : setFormElements((prev) => ({ ...prev, [key]: values }));
              } else if (selectedValue) {
                isApplyButtonActive
                  ? setTempFormElements((prev) => ({
                      ...prev,
                      [key]: (selectedValue as OptionType)?.value,
                    }))
                  : setFormElements((prev) => ({
                      ...prev,
                      [key]: (selectedValue as OptionType)?.value,
                    }));
              } else {
                isApplyButtonActive
                  ? setTempFormElements((prev) => ({
                      ...prev,
                      [key]: "",
                    }))
                  : setFormElements((prev) => ({
                      ...prev,
                      [key]: "",
                    }));
              }
            }
            const changedInput = inputs.find((input) => input.formKey === key);
            if (changedInput?.invalidateKeys) {
              changedInput.invalidateKeys.forEach((key) => {
                isApplyButtonActive
                  ? setTempFormElements((prev) => ({
                      ...prev,
                      [key.key]: key.defaultValue,
                    }))
                  : setFormElements((prev) => ({
                      ...prev,
                      [key.key]: key.defaultValue,
                    }));
              });
            }
            if (changedInput?.additionalOnChange) {
              changedInput.additionalOnChange(selectedValue);
            }
            setCurrentPage(1);
          };
        if (input.isDisabled) return null;
        return (
          <div key={input.formKey} className="flex flex-col gap-2">
            {(input.type === InputTypes.TEXT ||
              input.type === InputTypes.NUMBER ||
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
                isOnClearActive={input?.isOnClearActive}
                isDebounce={input?.isDebounce ?? false}
                onClear={() =>
                  isApplyButtonActive
                    ? setTempFormElements((prev) => ({
                        ...prev,
                        [input.formKey]: "",
                      }))
                    : setFormElements((prev) => ({
                        ...prev,
                        [input.formKey]: "",
                      }))
                }
              />
            )}
            {input.type === InputTypes.DATE && (
              <DateInput
                key={input.formKey}
                value={value}
                label={
                  input.required && input.label
                    ? input.label
                    : input.label ?? ""
                }
                placeholder={input.placeholder ?? ""}
                onChange={(val) => handleChange(input.formKey)(val ?? "")}
                isArrowsEnabled={input.isArrowsEnabled ?? false}
                requiredField={input.required}
                isOnClearActive={input?.isOnClearActive ?? true}
                isDateInitiallyOpen={input.isDateInitiallyOpen ?? false}
                isTopFlexRow={input.isTopFlexRow ?? false}
                isDebounce={input.isDebounce ?? true}
                isReadOnly={input.isReadOnly ?? false}
              />
            )}
            {input.type === InputTypes.SELECT && !input.isDisabled && (
              <SelectInput
                key={
                  input.isMultiple
                    ? input.formKey
                    : input.formKey + tempFormElements[input.formKey]
                }
                value={
                  input.isMultiple
                    ? input.options?.filter((option) =>
                        tempFormElements[input.formKey]?.includes(option.value)
                      )
                    : input.options?.find(
                        (option) =>
                          option.value === tempFormElements[input.formKey]
                      )
                }
                label={input.label ?? ""}
                options={input.options ?? []}
                placeholder={input.placeholder ?? ""}
                isMultiple={input.isMultiple ?? false}
                isAutoFill={input.isAutoFill ?? true}
                onChange={handleChangeForSelect(input.formKey)}
                isOnClearActive={input?.isOnClearActive ?? true}
                onClear={() => {
                  isApplyButtonActive
                    ? setTempFormElements((prev) => ({
                        ...prev,
                        [input.formKey]: input.isMultiple ? [] : "",
                      }))
                    : setFormElements((prev) => ({
                        ...prev,
                        [input.formKey]: input.isMultiple ? [] : "",
                      }));
                }}
              />
            )}
            {input.type === InputTypes.MONTHYEAR && (
              <MonthYearInput
                key={input.formKey}
                value={value}
                label={
                  input.required && input.label
                    ? input.label
                    : input.label ?? ""
                }
                onChange={handleChange(input.formKey)}
                requiredField={input.required}
                isReadOnly={input.isReadOnly ?? false}
              />
            )}
            {input.type === InputTypes.TEXTAREA && (
              <div className="flex flex-col gap-2" key={input.formKey}>
                <H6>{input.label}</H6>
                <textarea
                  id={"textarea-input"}
                  value={value}
                  onChange={(e) => {
                    handleChange(input.formKey)(e.target.value);
                  }}
                  placeholder={input.placeholder ?? ""}
                  className="border text-sm border-gray-300 rounded-md p-2"
                />
              </div>
            )}
            {input.type === InputTypes.HOUR && (
              <HourInput
                key={input.formKey}
                value={value}
                label={
                  input.required && input.label
                    ? input.label
                    : input.label ?? ""
                }
                onChange={handleChange(input.formKey)}
                requiredField={input.required}
                isReadOnly={input.isReadOnly ?? false}
              />
            )}
          </div>
        );
      })}
      <div className="flex flex-row w-fit gap-2 ml-auto">
        {buttons
          .filter((button) => !button.isDisabled)
          .map((button) => {
            return (
              <GenericButton
                key={button.label}
                variant="primary"
                size="sm"
                className="mt-4"
                onClick={button.onClick}
              >
                {t(button.label)}
              </GenericButton>
            );
          })}
      </div>
    </div>
  );
};

export default FilterPanel;

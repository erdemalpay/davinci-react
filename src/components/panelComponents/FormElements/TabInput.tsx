import React from "react";
import { IoIosClose } from "react-icons/io";
import { useGeneralContext } from "../../../context/General.context";
import { FormElementsState, OptionType } from "../../../types";
import { H6 } from "../Typography";

interface TabInputProps {
  label?: string;
  options: OptionType[];
  value: OptionType | null;
  onClear?: () => void;
  placeholder?: string;
  requiredField?: boolean;
  formElements: FormElementsState;
  setFormElements: (value: FormElementsState) => void;
  setForm?: (value: FormElementsState) => void;

  isReadOnly?: boolean;
  isTopFlexRow?: boolean;
  formKey: string;
  suggestedOption?: OptionType[] | null;
  invalidateKeys?: {
    key: string;
    defaultValue:
      | string
      | boolean
      | number
      | undefined
      | Array<string>
      | Array<number>;
  }[];
}
const TabInput: React.FC<TabInputProps> = ({
  label,
  options,
  value,
  onClear,
  placeholder,
  requiredField = false,
  isReadOnly = false,
  isTopFlexRow = false,
  formKey,
  invalidateKeys = [],
  suggestedOption,
  setFormElements,
  setForm,
}) => {
  const {
    setIsTabInputScreenOpen,
    setTabInputScreenOptions,
    setTabInputFormKey,
    setTabInputInvalidateKeys,
  } = useGeneralContext();
  const openTabScreen = () => {
    if (isReadOnly) return;
    setTabInputScreenOptions(options);
    setIsTabInputScreenOpen(true);
    setTabInputFormKey(formKey);
    setTabInputInvalidateKeys(invalidateKeys ?? []);
  };
  const handleSelect = (option: OptionType) => {
    setFormElements((prev: FormElementsState) => ({
      ...prev,
      [formKey]: option.value,
    }));
    setForm?.((prev: FormElementsState) => ({
      ...prev,
      [formKey]: option.value,
    }));
    if (invalidateKeys) {
      invalidateKeys.forEach((key) => {
        setFormElements((prev: FormElementsState) => ({
          ...prev,
          [key.key]: key.defaultValue,
        }));
      });
    }
  };
  return (
    <div
      className={`flex ${
        isTopFlexRow
          ? "flex-row items-center sm:flex-col sm:items-baseline "
          : "flex-col"
      } gap-2 `}
    >
      <H6 className="flex items-center gap-2">
        <span>{label}</span>
        {requiredField && <span className="text-red-400">*</span>}

        {Array.isArray(suggestedOption) &&
          suggestedOption.map((opt) =>
            options.some((o) => o.value === opt.value) &&
            value?.value !== opt.value ? (
              <button
                key={opt.value}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleSelect(opt);
                }}
                className="ml-2 text-xs sm:text-sm px-2 py-1 rounded-full border border-blue-600 text-blue-700 hover:bg-blue-50 active:bg-blue-100 transition"
                title={`Use suggested: ${opt.label}`}
              >
                {opt.label}
              </button>
            ) : null
          )}
      </H6>

      <div className="w-full flex items-center gap-2">
        {value ? (
          <div
            onClick={openTabScreen}
            className="flex items-center gap-2 border border-gray-300 rounded px-3 py-2 w-full"
          >
            <span className="flex-1 text-gray-800">{value.label}</span>
            {!isReadOnly && onClear && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onClear();
                }}
                className="text-xl text-gray-500 hover:text-red-600"
              >
                <IoIosClose />
              </button>
            )}
          </div>
        ) : (
          <button
            onClick={openTabScreen}
            className={`
              flex items-center w-full border border-gray-300 rounded px-3 py-2 
              text-gray-400 hover:border-gray-400
              ${isReadOnly ? "opacity-50 cursor-not-allowed" : ""}
            `}
          >
            {placeholder || "Select..."}
          </button>
        )}
      </div>
    </div>
  );
};

export default React.memo(TabInput);

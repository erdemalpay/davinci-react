import React from "react";
import { IoIosClose } from "react-icons/io";
import { useGeneralContext } from "../../../context/General.context";
import { OptionType } from "../../../types";
import { H6 } from "../Typography";

interface TabInputProps {
  label?: string;
  options: OptionType[];
  value: OptionType | null;
  onClear?: () => void;
  placeholder?: string;
  requiredField?: boolean;
  isReadOnly?: boolean;
  isTopFlexRow?: boolean;
  formKey: string;
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
  return (
    <div
      className={`flex ${
        isTopFlexRow
          ? "flex-row items-center sm:flex-col sm:items-baseline "
          : "flex-col"
      } gap-2 `}
    >
      <H6>
        {label}
        {requiredField && <span className="text-red-400">*</span>}
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

import React, { useEffect } from "react";
import { IoIosClose } from "react-icons/io";
import { useGeneralContext } from "../../../context/General.context";
import { OptionType } from "../../../types";
import { H6 } from "../Typography";

interface TabInputProps {
  label?: string;
  options: OptionType[];
  value: OptionType | null;
  onChange: (
    option: OptionType,
    actionMeta: { action: "select-option"; option: OptionType }
  ) => void;
  onClear?: () => void;
  placeholder?: string;
  requiredField?: boolean;
  isReadOnly?: boolean;
  isTopFlexRow?: boolean;
}
const TabInput: React.FC<TabInputProps> = ({
  label,
  options,
  value,
  onChange,
  onClear,
  placeholder,
  requiredField = false,
  isReadOnly = false,
  isTopFlexRow = false,
}) => {
  const {
    setIsTabInputScreenOpen,
    setTabInputScreenOptions,
    setTabInputOnChange,
    setTabInputSelectedValue,
  } = useGeneralContext();
  useEffect(() => {
    if (options.length === 1 && !value) {
      onChange(options[0], { action: "select-option", option: options[0] });
    }
  }, [options, value, onChange]);
  const openTabScreen = () => {
    if (isReadOnly) return;
    setIsTabInputScreenOpen(true);
    setTabInputScreenOptions(
      options.map((o) => ({
        value: o.value,
        label: o.label,
        imageUrl: o.imageUrl,
      }))
    );
    setTabInputSelectedValue(value);
    setTabInputOnChange(onChange);
  };
  return (
    <div
      className={`flex ${
        isTopFlexRow ? "flex-row items-center" : "flex-col"
      } gap-2`}
    >
      <H6>
        {label}
        {requiredField && <span className="text-red-400">*</span>}
      </H6>

      <div className="w-full flex items-center gap-2">
        {value ? (
          <div className="flex items-center gap-2 border border-gray-300 rounded px-3 py-2 w-full">
            <span className="flex-1 text-gray-800">{value.label}</span>
            {!isReadOnly && onClear && (
              <button
                onClick={onClear}
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
              text-gray-500 hover:border-gray-400
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

export default TabInput;

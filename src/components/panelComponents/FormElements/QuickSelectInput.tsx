import React from "react";
import { MultiValue, SingleValue } from "react-select";
import { OptionType } from "../../../types";
import { GenericButton } from "../../common/GenericButton";
import { H6 } from "../Typography";
import SelectInput from "./SelectInput";

interface QuickSelectInputProps {
  label?: string;
  value: OptionType | null;
  quickOptions: OptionType[];
  allOptions: OptionType[];
  onChange: (value: SingleValue<OptionType> | MultiValue<OptionType>) => void;
  onClear?: () => void;
  placeholder?: string;
  requiredField?: boolean;
  disabled?: boolean;
  isReadOnly?: boolean;
  isTopFlexRow?: boolean;
}

const QuickSelectInput: React.FC<QuickSelectInputProps> = ({
  label,
  value,
  quickOptions,
  allOptions,
  onChange,
  onClear,
  placeholder = "Select an option",
  requiredField = false,
  disabled = false,
  isReadOnly = false,
  isTopFlexRow = false,
}) => {
  const handleQuickSelect = (option: OptionType) => {
    if (disabled || isReadOnly) return;
    onChange(option);
  };

  return (
    <div
      className={`flex ${
        isTopFlexRow ? "flex-row sm:flex-col" : "flex-col"
      } gap-2 w-full`}
    >
      {label && (
        <H6 className="min-w-10">
          {label}
          {requiredField && <span className="text-red-400">*</span>}
        </H6>
      )}

      <div className="flex flex-row gap-4 justify-between w-full">
        <div className="flex flex-wrap gap-2">
          {quickOptions.map((option) => {
            const isSelected = value?.value === option.value;
            return (
              <GenericButton
                key={option.value}
                onClick={() => handleQuickSelect(option)}
                disabled={disabled || isReadOnly}
                variant={isSelected ? "primary" : "outline"}
                size="sm"
                className={`px-4 py-2 transition-all ${
                  isSelected ? "ring-2 ring-blue-300" : "hover:border-blue-400"
                }`}
              >
                {option.label}
              </GenericButton>
            );
          })}
        </div>
        <SelectInput
          value={value}
          options={allOptions}
          placeholder={placeholder}
          isMultiple={false}
          onChange={onChange}
          onClear={onClear}
          //   disabled={disabled}
          isReadOnly={isReadOnly}
          isAutoFill={false}
        />
      </div>
    </div>
  );
};

export default QuickSelectInput;

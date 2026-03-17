import React, { useState } from "react";
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
  isSelectAbove?: boolean;
  isSelectBelow?: boolean;
  isSelectAlwaysVisible?: boolean;
  gridRow?: number;
  gridCol?: number;
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
  isSelectAbove = false,
  isSelectBelow = false,
  isSelectAlwaysVisible = false,
  gridRow,
  gridCol,
}) => {
  const [showOthers, setShowOthers] = useState(false);

  const handleQuickSelect = (option: OptionType) => {
    if (disabled || isReadOnly) return;
    onChange(option);
  };

  const isQuickOption = quickOptions.some((opt) => opt.value === value?.value);
  const shouldShowOthersSelect =
    !isSelectAlwaysVisible && (showOthers || (!!value && !isQuickOption));
  const gridRows = gridRow ?? 0;
  const gridCols = gridCol ?? 0;
  const isGridLayout = gridRows > 0 && gridCols > 0;
  const gridCellHeightRem = 3.5;
  const shouldShowInlineSelect = !isSelectAbove && !isSelectBelow;
  const shouldShowTopSelect =
    (isSelectAlwaysVisible || shouldShowOthersSelect) && isSelectAbove;
  const shouldShowMiddleSelect =
    (isSelectAlwaysVisible || shouldShowOthersSelect) && shouldShowInlineSelect;
  const shouldShowBottomSelect =
    (isSelectAlwaysVisible || shouldShowOthersSelect) && isSelectBelow;
  const quickOptionsContainerStyle = isGridLayout
    ? {
        gridTemplateColumns: `repeat(${gridCols}, minmax(0, 1fr))`,
        gridAutoRows: `${gridCellHeightRem}rem`,
      }
    : undefined;

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

      <div
        className={`flex gap-4 w-full h-full ${
          isSelectAbove || isSelectBelow
            ? "flex-col"
            : "flex-row justify-between"
        }`}
      >
        {shouldShowTopSelect && (
          <SelectInput
            value={value}
            options={allOptions}
            placeholder={placeholder}
            isMultiple={false}
            onChange={onChange}
            onClear={onClear}
            isReadOnly={isReadOnly}
            isAutoFill={false}
          />
        )}
        <div
          className={`${isGridLayout ? "grid gap-2" : "flex flex-wrap"} gap-2`}
          style={quickOptionsContainerStyle}
        >
          {quickOptions.map((option) => {
            const isSelected = value?.value === option.value;
            return (
              <GenericButton
                key={option.value}
                onClick={() => handleQuickSelect(option)}
                disabled={disabled || isReadOnly}
                variant={isSelected ? "primary" : "outline"}
                size="sm"
                className={`${
                  isGridLayout
                    ? "w-full min-h-14 px-2 py-1"
                    : "px-4 py-2"
                } transition-all ${
                  isSelected ? "ring-2 ring-blue-300" : "hover:border-blue-400"
                }`}
                title={option.label}
              >
                <span className={isGridLayout ? "line-clamp-2 leading-tight text-center break-words" : ""}>
                  {option.label}
                </span>
              </GenericButton>
            );
          })}
          {!isSelectAlwaysVisible && (
            <GenericButton
              onClick={() => setShowOthers(!showOthers)}
              disabled={disabled || isReadOnly}
              variant={!isQuickOption && value ? "primary" : "outline"}
              size="sm"
              className={`${
                isGridLayout ? "w-full h-14 px-2 overflow-hidden" : "px-4 py-2"
              } transition-all ${
                !isQuickOption && value
                  ? "ring-2 ring-blue-300"
                  : "hover:border-blue-400"
              }`}
            >
              Others
            </GenericButton>
          )}
        </div>
        {shouldShowMiddleSelect && (
          <SelectInput
            value={value}
            options={allOptions}
            placeholder={placeholder}
            isMultiple={false}
            onChange={onChange}
            onClear={onClear}
            isReadOnly={isReadOnly}
            isAutoFill={false}
          />
        )}
        {shouldShowBottomSelect && (
          <SelectInput
            value={value}
            options={allOptions}
            placeholder={placeholder}
            isMultiple={false}
            onChange={onChange}
            onClear={onClear}
            isReadOnly={isReadOnly}
            isAutoFill={false}
          />
        )}
      </div>
    </div>
  );
};

export default QuickSelectInput;

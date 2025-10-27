import { useRef, useState } from "react";
import { SketchPicker } from "react-color";
import "react-day-picker/dist/style.css";
import { FiMinusCircle } from "react-icons/fi";
import { GoPlusCircle } from "react-icons/go";
import { IoIosClose } from "react-icons/io";
import {
  MdOutlineCheckBox,
  MdOutlineCheckBoxOutlineBlank,
} from "react-icons/md";
import { GenericButton } from "../../common/GenericButton";
import { H6 } from "../Typography";

type TextInputProps = {
  label?: string;
  placeholder?: string;
  type: string;
  value: any;
  onChange: (value: any) => void;
  className?: string;
  disabled?: boolean;
  onClear?: () => void;
  isDatePicker?: boolean;
  isTopFlexRow?: boolean;
  inputWidth?: string;
  requiredField?: boolean;
  isDateInitiallyOpen?: boolean;
  minNumber?: number;
  isMinNumber?: boolean;
  isNumberButtonsActive?: boolean;
  isOnClearActive?: boolean;
  isDebounce?: boolean;
  isDatePickerLabel?: boolean;
  isReadOnly?: boolean;
};

const TextInput = ({
  label,
  placeholder,
  value,
  type,
  onChange,
  disabled,
  isTopFlexRow,
  onClear,
  inputWidth,
  minNumber = 0,
  isMinNumber = true,
  isNumberButtonsActive = false,
  isOnClearActive = true,
  requiredField = false,
  isDebounce = false,
  isReadOnly = false,
  className = "px-4 py-2.5 border rounded-md __className_a182b8",
}: TextInputProps) => {
  const [localValue, setLocalValue] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);
  const [debounceTimer, setDebounceTimer] = useState<NodeJS.Timeout | null>(
    null
  );
  const handleDivClick = () => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  // Debounce onChange
  const handleChange = (e: { target: { value: string | number } }) => {
    const newValue =
      type === "number" && +e.target.value < minNumber && isMinNumber
        ? minNumber.toString()
        : e.target.value;
    setLocalValue(newValue);
    if (isDebounce) {
      if (debounceTimer) {
        clearTimeout(debounceTimer);
      }
      const timer = setTimeout(() => {
        onChange(newValue);
      }, 1000);
      setDebounceTimer(timer);
    } else {
      onChange(newValue);
    }
  };

  const handleIncrement = () => {
    if (type === "number") {
      const newValue = Math.max(minNumber, +localValue + 1);
      const newValueStr = newValue.toString();
      setLocalValue(newValueStr);

      if (isDebounce) {
        if (debounceTimer) {
          clearTimeout(debounceTimer);
        }
        const timer = setTimeout(() => {
          onChange(newValueStr);
        }, 1000);
        setDebounceTimer(timer);
      } else {
        onChange(newValueStr);
      }

      if (inputRef.current) {
        inputRef.current.readOnly = true;
        setTimeout(() => {
          if (inputRef.current) inputRef.current.readOnly = false;
        }, 0);
      }
    }
  };
  const handleDecrement = () => {
    if (type === "number" && +localValue > minNumber) {
      const newValue = Math.max(minNumber, +localValue - 1);
      const newValueStr = newValue.toString();
      setLocalValue(newValueStr);

      if (isDebounce) {
        if (debounceTimer) {
          clearTimeout(debounceTimer);
        }
        const timer = setTimeout(() => {
          onChange(newValueStr);
        }, 1000);
        setDebounceTimer(timer);
      } else {
        onChange(newValueStr);
      }

      if (inputRef.current) {
        inputRef.current.readOnly = true;
        setTimeout(() => {
          if (inputRef.current) inputRef.current.readOnly = false;
        }, 0);
      }
    }
  };

  const inputClassName = `${className} ${
    inputWidth ? "border-gray-200" : ""
  } w-full text-sm ${
    type === "number" ? "inputHideNumberArrows" : ""
  } text-base`;

  const handleWheel = () => {
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
  };

  if (type === "color") {
    return (
      <div
        className={` flex ${
          isTopFlexRow ? "flex-row sm:flex-col" : "flex-col"
        } gap-2  w-full items-center`}
      >
        <H6 className="min-w-10">
          {label}
          {requiredField && (
            <>
              <span className="text-red-400">* </span>
            </>
          )}
        </H6>
        <div className=" flex flex-row gap-2 ">
          <SketchPicker
            color={value}
            onChange={(color) => {
              onChange(color.hex);
            }}
          />

          <GenericButton
            onClick={() => {
              onChange("");
            }}
            variant="danger"
            size="sm"
            className="h-8 w-8 p-0"
          >
            <IoIosClose size={20} />
          </GenericButton>
        </div>
      </div>
    );
  }
  if (type === "checkbox") {
    return (
      <div className="flex justify-between items-center w-full">
        {/* Label on the left */}
        <H6 className="my-auto">
          {label}
          {requiredField && <span className="text-red-400">*</span>}
        </H6>

        {/* Icon on the right */}
        <GenericButton
          type="button"
          disabled={disabled}
          onClick={() => {
            const newValue = !(localValue ?? value);
            setLocalValue(newValue);
            onChange(newValue);
          }}
          variant="icon"
        >
          {localValue ?? value ? (
            <MdOutlineCheckBox className="h-6 w-6" />
          ) : (
            <MdOutlineCheckBoxOutlineBlank className="h-6 w-6" />
          )}
        </GenericButton>
      </div>
    );
  }

  return (
    <div
      className={` flex ${isTopFlexRow ? "flex-row gap-4 " : "flex-col gap-2"}`}
      onClick={handleDivClick}
    >
      <H6 className={`${isTopFlexRow ? "min-w-20 " : "min-w-10"} my-auto`}>
        {label}
        {requiredField && (
          <>
            <span className="text-red-400">* </span>
          </>
        )}
      </H6>
      <div
        className={`flex items-center justify-end ${
          isNumberButtonsActive ? "gap-4" : "gap-2"
        } ${inputWidth ? inputWidth : "w-full"}`}
      >
        <input
          id={"number-input"}
          ref={inputRef}
          type={type}
          style={{
            fontSize: "16px",
          }}
          placeholder={placeholder}
          disabled={disabled || isReadOnly}
          value={localValue}
          onChange={handleChange}
          className={inputClassName}
          {...(isMinNumber && (type === "number" ? { min: minNumber } : {}))}
          onWheel={type === "number" ? handleWheel : undefined}
        />
        {isNumberButtonsActive && (
          <FiMinusCircle
            className="w-8 h-8 flex-shrink-0 text-red-500 hover:text-red-800 cursor-pointer focus:outline-none"
            onClick={handleDecrement}
          />
        )}
        {isNumberButtonsActive && (
          <GoPlusCircle
            className="w-8 h-8 flex-shrink-0 text-green-500 hover:text-green-800 cursor-pointer focus:outline-none"
            onClick={handleIncrement}
          />
        )}
        {onClear && isOnClearActive && (
          <GenericButton
            onClick={() => {
              setLocalValue("");
              onClear();
            }}
            variant="icon"
            className="w-8 h-8 my-auto text-2xl text-gray-500 hover:text-red-700"
          >
            <IoIosClose size={28} />
          </GenericButton>
        )}
      </div>
    </div>
  );
};

export default TextInput;

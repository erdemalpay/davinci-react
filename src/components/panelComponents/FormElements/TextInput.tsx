import { ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/24/outline";
import {
  Input,
  Popover,
  PopoverContent,
  PopoverHandler,
} from "@material-tailwind/react";
import { format, parseISO } from "date-fns";
import { useEffect, useRef, useState } from "react";
import { SketchPicker } from "react-color";
import { DayPicker } from "react-day-picker";
import "react-day-picker/dist/style.css";
import { useTranslation } from "react-i18next";
import { FiMinusCircle } from "react-icons/fi";
import { GoPlusCircle } from "react-icons/go";
import { IoIosClose } from "react-icons/io";
import {
  MdOutlineCheckBox,
  MdOutlineCheckBoxOutlineBlank,
} from "react-icons/md";
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
  isDatePicker = false,
  minNumber = 0,
  isMinNumber = true,
  isDateInitiallyOpen = false,
  isNumberButtonsActive = false,
  isOnClearActive = true,
  requiredField = false,
  isDebounce = false,
  isDatePickerLabel = true,
  isReadOnly = false,
  className = "px-4 py-2.5 border rounded-md __className_a182b8",
}: TextInputProps) => {
  const [localValue, setLocalValue] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);
  const { t } = useTranslation();
  const [debounceTimer, setDebounceTimer] = useState<NodeJS.Timeout | null>(
    null
  );
  const handleDivClick = () => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };
  useEffect(() => {
    if (isDateInitiallyOpen && type === "date" && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.click();
    }
  }, [isDateInitiallyOpen, type]);

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
        onChange(newValue); // Only call onChange after the debounce delay
      }, 1000); // 1 second delay
      setDebounceTimer(timer);
    } else {
      onChange(newValue);
    }
  };

  const handleIncrement = () => {
    if (type === "number") {
      const newValue = Math.max(minNumber, +localValue + 1);
      setLocalValue(newValue.toString());
      onChange(newValue.toString());

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
      setLocalValue(newValue.toString());
      onChange(newValue.toString());
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

          <button
            onClick={() => {
              onChange("");
            }}
            className="flex items-center justify-center h-8 w-8 rounded-md bg-red-500 text-white hover:bg-red-600 transition-colors duration-300"
          >
            <IoIosClose size={20} />
          </button>
        </div>
      </div>
    );
  }
  if (isDatePicker) {
    return (
      <div
        className={` flex ${
          isTopFlexRow ? "flex-row sm:flex-col" : "flex-col"
        } gap-2  w-full `}
      >
        {isDatePickerLabel && (
          <H6 className=" min-w-10">
            {label}
            {requiredField && (
              <>
                <span className="text-red-400">* </span>
              </>
            )}
          </H6>
        )}
        <div className="flex flex-row gap-2">
          <Popover placement="bottom">
            <PopoverHandler>
              <Input
                label={label}
                value={value ? format(parseISO(value), "dd/MM/yyyy") : ""}
                disabled={disabled}
                placeholder={placeholder}
                data-initialized="true"
              />
            </PopoverHandler>
            <PopoverContent>
              <DayPicker
                mode="single"
                selected={
                  value
                    ? new Date(
                        new Date(value).getTime() +
                          new Date(value).getTimezoneOffset() * 60000
                      )
                    : new Date()
                }
                onSelect={(day) => {
                  const formattedDate = day
                    ? format(day, "yyyy-MM-dd")
                    : format(new Date(), "yyyy-MM-dd");
                  onChange(formattedDate);
                }}
                showOutsideDays
                className="border-0"
                classNames={{
                  caption: "flex justify-center mb-2  relative items-center",
                  caption_label: "text-lg font-medium text-gray-900",
                  nav: "absolute inset-0 flex justify-between items-center px-2",
                  nav_button:
                    "h-6 w-6 bg-transparent hover:bg-blue-gray-50 p-1 rounded-md transition-colors duration-300",
                  nav_button_previous: "absolute left-1.5",
                  nav_button_next: "absolute right-1.5",
                  table: "w-full border-collapse",
                  head_row: "flex font-bold text-gray-900",
                  head_cell: "m-0.5 w-9 font-normal text-sm",
                  row: "flex w-full mt-2",
                  cell: "text-gray-600 rounded-md h-9 w-9 text-center text-sm p-0 m-0.5 relative [&:has([aria-selected].day-range-end)]:rounded-r-md [&:has([aria-selected].day-outside)]:bg-gray-900/20 [&:has([aria-selected].day-outside)]:text-white [&:has([aria-selected])]:bg-gray-900/50 first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20 __className_a182b8",
                  day: "h-9 w-9 p-0 font-normal",
                  day_range_end: "day-range-end",
                  day_selected:
                    "rounded-md bg-gray-900 text-white hover:bg-gray-900 hover:text-white focus:bg-gray-900 focus:text-white ",
                  day_today: "rounded-md bg-gray-200 text-gray-900 ",
                  day_outside:
                    "day-outside text-gray-500 opacity-50 aria-selected:bg-gray-500 aria-selected:text-gray-900 aria-selected:bg-opacity-10",
                  day_disabled: "text-gray-500 opacity-50",
                  day_hidden: "invisible",
                }}
                components={{
                  IconLeft: ({ ...props }) => (
                    <ChevronLeftIcon {...props} className="h-4 w-4 stroke-2" />
                  ),
                  IconRight: ({ ...props }) => (
                    <ChevronRightIcon {...props} className="h-4 w-4 stroke-2" />
                  ),
                }}
              />
            </PopoverContent>
          </Popover>
          {onClear && value && isOnClearActive && (
            <button
              onClick={() => {
                setLocalValue("");
                onClear();
              }}
              className="w-8 h-8 my-auto text-2xl text-gray-500 hover:text-red-700"
            >
              <IoIosClose />
            </button>
          )}
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
        <button
          type="button"
          disabled={disabled}
          onClick={() => {
            const newValue = !(localValue ?? value);
            setLocalValue(newValue);
            onChange(newValue);
          }}
          className="focus:outline-none"
        >
          {localValue ?? value ? (
            <MdOutlineCheckBox className="h-6 w-6" />
          ) : (
            <MdOutlineCheckBoxOutlineBlank className="h-6 w-6" />
          )}
        </button>
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
        className={`flex items-center ${
          isNumberButtonsActive ? "gap-4" : "gap-2"
        } ${inputWidth ? inputWidth : "w-full"}`}
      >
        {isNumberButtonsActive && (
          <FiMinusCircle
            className="w-8 h-8 flex-shrink-0 text-red-500 hover:text-red-800 cursor-pointer focus:outline-none"
            onClick={handleDecrement}
          />
        )}
        <input
          ref={inputRef}
          type={type}
          style={{ fontSize: "16px" }}
          placeholder={placeholder}
          disabled={disabled || isReadOnly}
          value={localValue}
          onChange={handleChange}
          className={inputClassName}
          {...(isMinNumber && (type === "number" ? { min: minNumber } : {}))}
          onWheel={type === "number" ? handleWheel : undefined}
        />
        {isNumberButtonsActive && (
          <GoPlusCircle
            className="w-8 h-8 flex-shrink-0 text-green-500 hover:text-green-800 cursor-pointer focus:outline-none"
            onClick={handleIncrement}
          />
        )}
        {onClear && isOnClearActive && (
          <button
            onClick={() => {
              setLocalValue("");
              onClear();
            }}
            className="w-8 h-8 my-auto text-2xl text-gray-500 hover:text-red-700"
          >
            <IoIosClose />
          </button>
        )}
      </div>
    </div>
  );
};

export default TextInput;

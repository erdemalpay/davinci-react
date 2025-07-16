import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import dayjs, { Dayjs } from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";
import { useEffect, useRef } from "react";
import { IoIosClose } from "react-icons/io";
import { H6 } from "../Typography";

dayjs.extend(customParseFormat);

type DateInputProps = {
  label?: string;
  value: string | null;
  onChange: (value: string | null) => void;
  onClear?: () => void;
  requiredField?: boolean;
  disabled?: boolean;
  placeholder?: string;
  isTopFlexRow?: boolean;
  isOnClearActive?: boolean;
  isReadOnly?: boolean;
  isDateInitiallyOpen?: boolean;
};

const DateInput = ({
  label,
  value,
  onChange,
  onClear,
  requiredField = false,
  disabled = false,
  placeholder = "DD/MM/YYYY",
  isTopFlexRow = false,
  isOnClearActive = true,
  isReadOnly = false,
  isDateInitiallyOpen = false,
}: DateInputProps) => {
  const pickerRef = useRef<HTMLInputElement>(null);

  const parsedValue: Dayjs | null = value
    ? dayjs(value, "YYYY-MM-DD", true)
    : dayjs();

  useEffect(() => {
    if (isDateInitiallyOpen && pickerRef.current) {
      pickerRef.current.focus();
      pickerRef.current.click();
    }
  }, [isDateInitiallyOpen]);

  const handlePickerChange = (newValue: Dayjs | null) => {
    if (newValue && newValue.isValid()) {
      onChange(newValue.format("YYYY-MM-DD"));
    } else {
      onChange(null);
    }
  };

  const handleClear = () => {
    onChange(null);
    onClear?.();
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
          {requiredField && <span className="text-red-400">* </span>}
        </H6>
      )}
      <div className="flex flex-row gap-2 items-center">
        <LocalizationProvider dateAdapter={AdapterDayjs}>
          <DatePicker
            value={parsedValue}
            onChange={handlePickerChange}
            onAccept={handlePickerChange}
            format="DD/MM/YYYY"
            slotProps={{
              textField: { variant: "filled" },
            }}
          />
        </LocalizationProvider>
        {isOnClearActive && value && onClear && (
          <button
            onClick={handleClear}
            className="w-8 h-8 my-auto text-2xl text-gray-500 hover:text-red-700"
          >
            <IoIosClose />
          </button>
        )}
      </div>
    </div>
  );
};

export default DateInput;

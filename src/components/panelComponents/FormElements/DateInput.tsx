import { TextField } from "@mui/material";
import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";
import { useEffect, useRef, useState } from "react";
import { DayPicker } from "react-day-picker";
import "react-day-picker/dist/style.css";
import { FaRegCalendar } from "react-icons/fa";
import { IoIosClose } from "react-icons/io";
import InputMask from "react-input-mask";
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
  isDebounce?: boolean;
};

export default function DateInput({
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
  isDebounce = false,
}: DateInputProps) {
  const [inputText, setInputText] = useState("");
  const [showCalendar, setShowCalendar] = useState(false);
  const [month, setMonth] = useState<Date>(new Date());
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const todayYear = String(dayjs().year());

  useEffect(() => {
    if (value) {
      const p = dayjs(value, "YYYY-MM-DD", true);
      if (p.isValid()) {
        setInputText(p.format("DD/MM/YYYY"));
        setMonth(p.toDate());
      }
    } else {
      setInputText("");
      setMonth(new Date());
      if (isDateInitiallyOpen) setShowCalendar(true);
    }
  }, [value, isDateInitiallyOpen]);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setShowCalendar(false);
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  const commit = (raw: string) => {
    const digits = raw.replace(/\D/g, "");
    const d = digits.slice(0, 2);
    const m = digits.slice(2, 4);
    const y = digits.slice(4, 8) || todayYear;
    const str = `${d}/${m}/${y}`;
    const p = dayjs(str, "DD/MM/YYYY", true);
    onChange(p.isValid() ? p.format("YYYY-MM-DD") : null);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    setInputText(raw);
    const tryCommit = () => {
      if (/^\d{2}\/\d{2}\/\d{4}$/.test(raw)) commit(raw);
      else onChange(null);
    };
    if (isDebounce) {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(tryCommit, 1000);
    } else {
      tryCommit();
    }
  };

  const handleSelect = (date: Date | undefined) => {
    if (!date) return;
    const p = dayjs(date);
    const txt = p.format("DD/MM/YYYY");
    setInputText(txt);
    onChange(p.format("YYYY-MM-DD"));
    setMonth(date);
    setShowCalendar(false);
  };

  const handleClear = () => {
    setInputText("");
    onChange(null);
    onClear?.();
    setMonth(new Date());
  };

  const selectedDate = (() => {
    const p = dayjs(inputText, "DD/MM/YYYY", true);
    return p.isValid() ? p.toDate() : undefined;
  })();

  return (
    <div
      ref={containerRef}
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
      <div className="flex  flex-row justify-between items-center w-full">
        <div className="relative flex items-center gap-2 w-full">
          <InputMask
            mask="99/99/9999"
            maskChar=""
            value={inputText}
            onChange={handleChange}
            onFocus={() => setShowCalendar(true)}
            disabled={disabled}
          >
            {(maskProps) => (
              <TextField
                {...maskProps}
                fullWidth
                placeholder={placeholder}
                InputProps={{ readOnly: isReadOnly }}
              />
            )}
          </InputMask>

          <FaRegCalendar
            className="absolute right-3 cursor-pointer text-gray-500"
            onClick={() => setShowCalendar((v) => !v)}
          />

          {showCalendar && (
            <div className="absolute top-full mt-1 z-10 bg-white shadow-lg rounded-md  p-2">
              <DayPicker
                mode="single"
                selected={selectedDate}
                onSelect={handleSelect}
                month={month}
                onMonthChange={setMonth}
                captionLayout="dropdown"
              />
            </div>
          )}
        </div>
        {isOnClearActive && inputText && (
          <button
            onClick={handleClear}
            className="w-8 h-8 ml-2 text-gray-500 hover:text-red-700"
          >
            <IoIosClose />
          </button>
        )}
      </div>
    </div>
  );
}

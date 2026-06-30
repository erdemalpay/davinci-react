import { TextField } from "@mui/material";
import { tr } from "date-fns/locale";
import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";
import { useEffect, useRef, useState } from "react";
import { DayPicker } from "react-day-picker";
import "react-day-picker/dist/style.css";
import { FaRegCalendar } from "react-icons/fa";
import { IoIosArrowBack, IoIosArrowForward, IoIosClose } from "react-icons/io";
import InputMask from "react-input-mask";
import { GenericButton } from "../../common/GenericButton";
import { H6 } from "../Typography";
dayjs.extend(customParseFormat);

type DateInputProps = {
  label?: string;
  value: string | null; // expects "YYYY-MM-DD"
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
  isArrowsEnabled?: boolean;
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
  isArrowsEnabled = true,
}: DateInputProps) {
  const [inputText, setInputText] = useState("");
  const [showCalendar, setShowCalendar] = useState(false);
  const [month, setMonth] = useState(new Date());
  const [calendarPosition, setCalendarPosition] = useState({ top: 0, left: 0 });
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const calendarRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
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
    }
  }, [value]);

  useEffect(() => {
    if (isDateInitiallyOpen) {
      setShowCalendar(true);
      inputRef.current?.focus();
    }
  }, [isDateInitiallyOpen]);

  useEffect(() => {
    if (!showCalendar) return;

    const updateCalendarPosition = () => {
      const inputElement = inputRef.current;
      if (!inputElement) return;

      const rect = inputElement.getBoundingClientRect();
      setCalendarPosition({
        top: rect.bottom + 8,
        left: Math.max(8, Math.min(rect.left, window.innerWidth - 344)),
      });
    };

    updateCalendarPosition();
    window.addEventListener("resize", updateCalendarPosition);
    window.addEventListener("scroll", updateCalendarPosition, true);

    return () => {
      window.removeEventListener("resize", updateCalendarPosition);
      window.removeEventListener("scroll", updateCalendarPosition, true);
    };
  }, [showCalendar]);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node) &&
        !calendarRef.current?.contains(e.target as Node)
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
    if (p.isValid()) {
      onChange(p.format("YYYY-MM-DD"));
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    setInputText(raw);
    const doCommit = () => {
      if (/^\d{2}\/\d{2}\/\d{4}$/.test(raw)) commit(raw);
    };
    if (isDebounce) {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(doCommit, 1000);
    } else {
      doCommit();
    }
  };

  const handleSelect = (date?: Date) => {
    if (date) {
      const p = dayjs(date);
      const txt = p.format("DD/MM/YYYY");
      setInputText(txt);
      onChange(p.format("YYYY-MM-DD"));
      setMonth(date);
      setShowCalendar(false);
    }
  };

  const handleClear = () => {
    setInputText("");
    onChange(null);
    onClear?.();
    setMonth(new Date());
  };

  const selectedDate = (() => {
    const fromText = dayjs(inputText, "DD/MM/YYYY", true);
    if (fromText.isValid()) return fromText.toDate();
    if (value) {
      const fromVal = dayjs(value, "YYYY-MM-DD", true);
      if (fromVal.isValid()) return fromVal.toDate();
    }
    return undefined;
  })();

  const bumpDay = (delta: number) => {
    if (disabled || isReadOnly) return;
    const base =
      selectedDate ??
      (value ? dayjs(value, "YYYY-MM-DD", true).toDate() : new Date());
    const next = dayjs(base).add(delta, "day");
    setInputText(next.format("DD/MM/YYYY"));
    onChange(next.format("YYYY-MM-DD"));
    setMonth(next.toDate());
  };

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

      <div className="flex flex-row items-center justify-between">
        <div className="flex items-center gap-2 w-full">
          {isArrowsEnabled && (
            <GenericButton
              type="button"
              aria-label="Previous day"
              variant="ghost"
              size="sm"
              className="p-2"
              onClick={() => bumpDay(-1)}
              disabled={disabled || isReadOnly}
            >
              <IoIosArrowBack size={20} />
            </GenericButton>
          )}

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
                  inputRef={inputRef}
                />
              )}
            </InputMask>

            <FaRegCalendar
              className="absolute right-3 cursor-pointer text-gray-500"
              onClick={() => setShowCalendar((v) => !v)}
            />
          </div>

          {isArrowsEnabled && (
            <GenericButton
              type="button"
              aria-label="Next day"
              variant="ghost"
              size="sm"
              className="p-2"
              onClick={() => bumpDay(1)}
              disabled={disabled || isReadOnly}
            >
              <IoIosArrowForward size={20} />
            </GenericButton>
          )}
        </div>

        {showCalendar && (
          <div
            ref={calendarRef}
            className="fixed z-[9999] bg-white shadow-lg rounded-md p-2 border border-gray-200"
            style={{
              top: calendarPosition.top,
              left: calendarPosition.left,
            }}
            onMouseDown={(event) => event.stopPropagation()}
          >
            <DayPicker
              mode="single"
              selected={selectedDate}
              onSelect={handleSelect}
              month={month}
              onMonthChange={setMonth}
              captionLayout="dropdown"
              locale={tr}
              fromYear={2000}
              toYear={dayjs().year() + 10}
            />
          </div>
        )}

        {isOnClearActive && inputText && (
          <GenericButton
            onClick={handleClear}
            variant="icon"
            className="w-8 h-8 text-gray-500 hover:text-red-700"
          >
            <IoIosClose />
          </GenericButton>
        )}
      </div>
    </div>
  );
}

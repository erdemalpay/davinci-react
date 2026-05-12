import { useEffect, useRef, useState } from "react";
import { IoIosClose } from "react-icons/io";
import { MdArrowDropDown, MdOutlineDone } from "react-icons/md";
import { GenericButton } from "../../common/GenericButton";
import { H6 } from "../Typography";

type AutocompleteInputProps = {
  label?: string;
  placeholder?: string;
  value: string;
  options: Array<string | { value: string; label?: string }>;
  onChange: (value: string) => void;
  onClear?: () => void;
  className?: string;
  disabled?: boolean;
  requiredField?: boolean;
  isOnClearActive?: boolean;
  isTopFlexRow?: boolean;
  isReadOnly?: boolean;
  minCharacters?: number;
  isSortDisabled?: boolean;
};

const normalizeText = (text: string) => {
  return text
    ?.toLowerCase()
    ?.replace(/ı/g, "i")
    ?.replace(/i̇/g, "i")
    ?.replace(/ğ/g, "g")
    ?.replace(/ü/g, "u")
    ?.replace(/ş/g, "s")
    ?.replace(/ö/g, "o")
    ?.replace(/ç/g, "c");
};

const getOptionValue = (option: string | { value: string; label?: string }) =>
  typeof option === "string" ? option : option.value;

const getOptionLabel = (option: string | { value: string; label?: string }) =>
  typeof option === "string" ? option : option.label ?? option.value;

const AutocompleteInput = ({
  label,
  placeholder,
  value,
  options,
  onChange,
  onClear,
  disabled = false,
  isTopFlexRow = false,
  isOnClearActive = true,
  requiredField = false,
  isReadOnly = false,
  minCharacters = 2,
  isSortDisabled = false,
  className = "px-4 py-2.5 border border-gray-300 rounded-md",
}: AutocompleteInputProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [filteredOptions, setFilteredOptions] = useState<
    Array<string | { value: string; label?: string }>
  >([]);
  const [searchInput, setSearchInput] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const listboxIdRef = useRef(
    `autocomplete-listbox-${Math.random().toString(36).slice(2, 10)}`
  );

  // Update search input when value changes externally
  useEffect(() => {
    setSearchInput(value);
  }, [value]);

  // Filter options based on search input
  useEffect(() => {
    if (searchInput.length >= minCharacters) {
      const normalized = normalizeText(searchInput);
      const filtered = options.filter((option) =>
        normalizeText(getOptionValue(option)).includes(normalized)
      );

      // Sort the filtered options
      const sorted = isSortDisabled
        ? filtered
        : filtered.sort((a, b) => {
            const aStartsWith = normalizeText(getOptionValue(a))?.startsWith(
              normalized
            );
            const bStartsWith = normalizeText(getOptionValue(b))?.startsWith(
              normalized
            );
            if (aStartsWith && !bStartsWith) return -1;
            if (bStartsWith && !aStartsWith) return 1;
            return getOptionValue(a).localeCompare(getOptionValue(b));
          });

      setFilteredOptions(sorted);
    } else {
      setFilteredOptions([]);
      setIsOpen(false);
      setActiveIndex(-1);
    }
  }, [searchInput, options, minCharacters, isSortDisabled]);

  useEffect(() => {
    if (!isOpen) {
      setActiveIndex(-1);
      return;
    }

    if (filteredOptions.length === 0) {
      setActiveIndex(-1);
      return;
    }

    setActiveIndex((currentIndex) => {
      if (currentIndex < 0) return 0;
      if (currentIndex >= filteredOptions.length)
        return filteredOptions.length - 1;
      return currentIndex;
    });
  }, [filteredOptions, isOpen]);

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setSearchInput(newValue);
    setIsOpen(newValue.length >= minCharacters);
  };

  const handleInputKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (filteredOptions.length === 0) return;

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setIsOpen(true);
      setActiveIndex((currentIndex) =>
        currentIndex < filteredOptions.length - 1 ? currentIndex + 1 : 0
      );
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      setIsOpen(true);
      setActiveIndex((currentIndex) =>
        currentIndex > 0 ? currentIndex - 1 : filteredOptions.length - 1
      );
    }

    if (event.key === "Enter" && isOpen && activeIndex >= 0) {
      event.preventDefault();
      handleSelectOption(filteredOptions[activeIndex]);
    }

    if (event.key === "Escape") {
      event.preventDefault();
      setIsOpen(false);
    }
  };

  const handleSelectOption = (
    option: string | { value: string; label?: string }
  ) => {
    const optionValue = getOptionValue(option);
    onChange(optionValue);
    setSearchInput(optionValue);
    setIsOpen(false);
    setActiveIndex(-1);
  };

  const handleClear = () => {
    setSearchInput("");
    onChange("");
    onClear?.();
    inputRef.current?.focus();
  };

  const inputClassName = `${className} w-full text-base ${
    !isReadOnly && requiredField && !label ? "border-red-300" : ""
  }`;

  return (
    <div
      ref={containerRef}
      className={`flex ${
        isTopFlexRow ? "flex-row items-center gap-1" : "flex-col gap-2"
      } w-full relative`}
    >
      {label && (
        <H6
          className={`flex items-center gap-2 ${
            isTopFlexRow ? "w-28 flex-shrink-0" : ""
          }`}
        >
          <span>{label}</span>
          {requiredField && <span className="text-red-400">*</span>}
        </H6>
      )}

      <div className="flex flex-row gap-2 w-full relative">
        <div className="w-full relative">
          <div className="relative">
            <input
              ref={inputRef}
              type="text"
              placeholder={placeholder}
              value={searchInput}
              onChange={handleInputChange}
              onKeyDown={handleInputKeyDown}
              onFocus={() => {
                if (searchInput.length >= minCharacters) {
                  setIsOpen(true);
                }
              }}
              disabled={disabled || isReadOnly}
              role="combobox"
              aria-autocomplete="list"
              aria-expanded={isOpen}
              aria-controls={listboxIdRef.current}
              aria-activedescendant={
                isOpen && activeIndex >= 0
                  ? `${listboxIdRef.current}-option-${activeIndex}`
                  : undefined
              }
              className={`${inputClassName} pr-8`}
            />

            {/* Dropdown Arrow Icon */}
            <MdArrowDropDown
              className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 text-2xl pointer-events-none"
              style={{ opacity: isOpen ? 1 : 0.6 }}
            />

            {/* Suggestions Dropdown */}
            {isOpen && filteredOptions.length > 0 && (
              <div
                id={listboxIdRef.current}
                role="listbox"
                className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-md shadow-lg z-50 max-h-60 overflow-y-auto"
              >
                {filteredOptions.map((option) => (
                  <div
                    key={getOptionValue(option)}
                    id={`${
                      listboxIdRef.current
                    }-option-${filteredOptions.indexOf(option)}`}
                    role="option"
                    aria-selected={
                      activeIndex === filteredOptions.indexOf(option)
                    }
                    onClick={() => handleSelectOption(option)}
                    onMouseEnter={() =>
                      setActiveIndex(filteredOptions.indexOf(option))
                    }
                    className={`px-4 py-2.5 cursor-pointer flex items-center justify-between group transition-colors ${
                      activeIndex === filteredOptions.indexOf(option)
                        ? "bg-blue-50"
                        : "hover:bg-blue-50"
                    }`}
                  >
                    <span className="text-sm text-gray-700 group-hover:text-blue-600">
                      {getOptionLabel(option)}
                    </span>
                    {value === getOptionValue(option) && (
                      <MdOutlineDone className="text-blue-700 font-bold text-xl flex-shrink-0" />
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Clear Button */}
        {!isReadOnly && isOnClearActive && searchInput && onClear && (
          <GenericButton
            onClick={handleClear}
            variant="icon"
            className="w-10 h-10 my-auto text-gray-500 hover:text-red-700"
          >
            <IoIosClose size={28} />
          </GenericButton>
        )}
      </div>
    </div>
  );
};

export default AutocompleteInput;

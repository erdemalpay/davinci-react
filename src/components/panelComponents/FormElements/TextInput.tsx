import { useState } from "react";
import { IoIosClose } from "react-icons/io";
import { H6 } from "../Typography";

type TextInputProps = {
  label: string;
  placeholder: string;
  type: string;
  value: string;
  onChange: (value: string) => void;
  className?: string;
  disabled?: boolean;
  onClear?: () => void;
};

const TextInput = ({
  label,
  placeholder,
  value,
  type,
  onChange,
  disabled,
  onClear,
  className = "px-4 py-2.5 border rounded-md __className_a182b8",
}: TextInputProps) => {
  const [localValue, setLocalValue] = useState(value);

  const inputClassName = `${className} w-full text-sm ${
    type === "number" ? "inputHideNumberArrows" : ""
  }`;

  const handleWheel = () => {
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <H6>{label}</H6>
      <div className="flex flex-row gap-2 items-center">
        <input
          type={type}
          placeholder={placeholder}
          disabled={disabled}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={inputClassName}
          {...(type === "number" ? { min: "0", onWheel: handleWheel } : {})}
        />

        {onClear && value && (
          <button
            onClick={onClear}
            className=" w-8 h-8 my-auto text-2xl text-gray-500 hover:text-red-700"
          >
            <IoIosClose />
          </button>
        )}
      </div>
    </div>
  );
};

export default TextInput;
